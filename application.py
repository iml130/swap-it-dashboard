# SPDX-FileCopyrightText: The SWAP-IT Dashboard Contributors
# SPDX-License-Identifier: MIT

import bleach
import json
from flask import Flask, jsonify, request
from flask import render_template
from flask_socketio import SocketIO, disconnect
from threading import Thread, Event

from model.log_event import LogEvent

from model.petri_net import PetriNet
from model.pfdl_order import PfdlOrder
from datetime import datetime


# setup flask app
app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["SECRET_KEY"] = "secret!"
app.config["DEBUG"] = False
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = -1

# turn the flask app into a socketio app
socketio = SocketIO(app, async_mode="threading", logger=True, engineio_logger=True)

# random number Generator Thread
thread = Thread()
thread_stop_event = Event()

order_dict = {}
order_history_dict = {}


@app.template_filter()
def get_date_from_timestamp(value: int):
    return datetime.fromtimestamp(value).strftime("%d/%m/%Y, %H:%M:%S")


###
# Webserver
###


# route to the main order view
@app.route("/")
@app.route("/index")
def index():
    return render_template("index.html", orders=order_dict)


# route to the detailed order state of a specific order
@app.route("/order_state/<string:order_id>", methods=["GET"])
def order(order_id):
    if order_id in order_dict:
        order = order_dict[order_id]

        petri_net_content = ""
        if order.current_petri_net:
            petri_net_content = order.current_petri_net.content
        return render_template(
            "order_state.html",
            order=order,
            img_data=petri_net_content,
        )
    return None


# route to the fullscreen petri net view of a specific order
@app.route("/order_state/<string:order_id>/petri_net", methods=["GET"])
@app.route("/order_history/<string:order_id>/petri_net", methods=["GET"])
def order_petri_net(order_id):
    if order_id in order_dict:
        order = order_dict[order_id]
    elif order_id in order_history_dict:
        order = order_history_dict[order_id]
    else:
        return None

    petri_net_content = ""
    if order.current_petri_net:
        petri_net_content = order.current_petri_net.content
    return render_template(
        "view_petri_net.html",
        order=order,
        img_data=bleach.clean(petri_net_content),
    )


# route to the detailed order state of a specific, finished order
@app.route("/order_history/<string:order_id>", methods=["GET"])
def order_history_element(order_id):
    if order_id in order_history_dict:
        order = order_history_dict[order_id]

        petri_net_content = ""
        if order.current_petri_net:
            petri_net_content = order.current_petri_net.content
        return render_template(
            "order_state.html",
            order=order,
            img_data=petri_net_content,
        )
    return None


# load order history page
@app.route("/order_history")
def order_history():
    return render_template("order_history.html", orders=order_history_dict)


# load order creator page
@app.route("/order_creator")
def order_creator():
    return render_template("order_creator.html")


# load the event log page
@app.route("/log")
def log():
    return render_template("log.html", orders=order_dict)


# load the about page
@app.route("/about")
def about():
    return render_template("about.html")


@socketio.event
def disconnect_request():
    disconnect()


@socketio.on("disconnect")
def test_disconnect():
    global thread_stop_event
    thread_stop_event.set()


@socketio.on("connect", namespace="/pfdl")
def test_connect():
    # need visibility of the global thread object
    global thread
    print("Client connected")


###
# API Implementation
###


# react on a new order / order update
@app.route("/pfdl_order", methods=["POST"])
@app.route("/pfdl_order/", methods=["POST"])
def new_order():
    # global order_dict
    pfdl_order = json.loads(request.data)

    if pfdl_order["order_id"] in order_dict:
        po = order_dict[pfdl_order["order_id"]]
        po.starting_date = pfdl_order["starting_date"]
        po.last_update = pfdl_order["last_update"]
        po.status = pfdl_order["status"]
        po.pfdl_string = pfdl_order["pfdl_string"]

        last_log_messages = []
        for log_msg in po.getLatestLogMessages(3):
            last_log_messages.append(LogEvent.toJson(log_msg))

        if po.status != 4:
            order_dict[po.order_id] = po
            socketio.emit(
                "pfdl_order",
                {"pfdl_order": pfdl_order, "last_messages": last_log_messages},
                namespace="/pfdl",
            )
        else:
            del order_dict[po.order_id]
            order_history_dict[po.order_id] = po
            socketio.emit("remove_pfdl_order", {"pfdl_order": pfdl_order}, namespace="/pfdl")
    else:
        po = PfdlOrder(
            pfdl_order["order_id"],
            pfdl_order["starting_date"],
            pfdl_order["last_update"],
            pfdl_order["status"],
            pfdl_order["pfdl_string"],
        )
        if po.status != 4:
            order_dict[po.order_id] = po
            socketio.emit(
                "pfdl_order", {"pfdl_order": pfdl_order, "last_messages": []}, namespace="/pfdl"
            )
        else:
            order_history_dict[po.order_id] = po

    resp = jsonify(success=True)
    return resp


# get order information
@app.route("/pfdl_order", methods=["GET"])
@app.route("/pfdl_order/", methods=["GET"])
def get_pfdl_orders():
    orders = []
    for order in order_dict.values():
        order_json = order.toJson()
        order_data = json.loads(order_json)
        orders.append(order_data)
    return jsonify({"pfdl_orders": orders})


# get information about a specifc order
@app.route("/pfdl_order/<string:order_id>", methods=["GET"])
@app.route("/pfdl_order/<string:order_id>/", methods=["GET"])
def get_pfdl_order_by_id(order_id):
    if order_id in order_dict:
        resp = order_dict[order_id]
    return resp.toJson()


# react on a message containing information about a petri net update
@app.route("/petri_net", methods=["POST"])
@app.route("/petri_net/", methods=["POST"])
def update_petri_net():
    record = json.loads(request.data)

    order_id = record["order_id"]
    pn = PetriNet(order_id, record["content"], record["type_pn"])

    if order_id in order_dict:
        order_dict[order_id].current_petri_net = pn
        socketio.emit("new_petri_net", record, namespace="/pfdl")
    elif order_id in order_history_dict:
        order_history_dict[order_id].current_petri_net = pn
        socketio.emit("new_petri_net", record, namespace="/pfdl")

    resp = jsonify(success=True)
    return resp


# react on a new log event message
@app.route("/log_event", methods=["POST"])
@app.route("/log_event/", methods=["POST"])
def new_log_entry():
    log_event = json.loads(request.data)
    order_id = log_event["order_id"]
    l_e = LogEvent(
        log_event["order_id"],
        log_event["log_date"],
        log_event["log_message"],
        log_event["log_level"],
    )
    if order_id in order_dict:
        pfdl_order = order_dict[order_id]
        pfdl_order.log.append(l_e)

        last_log_messages = []
        for log_msg in pfdl_order.getLatestLogMessages(3):
            last_log_messages.append(LogEvent.toJson(log_msg))
        socketio.emit(
            "new_log_event",
            {"log_event": log_event, "last_messages": last_log_messages},
            namespace="/pfdl",
        )

    resp = jsonify(success=True)
    return resp


if __name__ == "__main__":
    socketio.run(app, port=8080)
