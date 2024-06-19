# SPDX-FileCopyrightText: The SWAP-IT Dashboard Contributors
# SPDX-License-Identifier: MIT

from enum import Enum
from typing import List
import json

from model.log_event import LogEvent
from model.petri_net import PetriNet


class PfdlOrder:
    def __init__(
        self,
        id: str = None,
        starting_date: int = 0,
        last_update: int = 0,
        status: int = 0,
        pfdl_string: str = "",
    ):
        self.order_id: str = id
        self.starting_date: int = starting_date
        self.last_update: int = last_update
        self.status: int = status
        self.log: List[LogEvent] = []
        self.current_petri_net: PetriNet = None
        self.pfdl_string: str = pfdl_string

    def getLatestLogMessages(self, latest_n):
        # sort
        sorted_log_messages = sorted(self.log, key=lambda x: x.log_date, reverse=True)
        if latest_n < len(self.log):
            last_n_elements = sorted_log_messages[:latest_n]
            return last_n_elements
        else:
            return sorted_log_messages

    def toJson(self):
        return json.dumps(self, default=lambda o: o.__dict__, sort_keys=True, indent=4)
