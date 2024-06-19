// SPDX-FileCopyrightText: The SWAP-IT Dashboard Contributors
// SPDX-License-Identifier: MIT

// this script contains relevant classes and methods to create a code visualization
// for the dashboard

// class that contains all relevant information needed to draw a new Petri Net
class PetriNetInfos {
  constructor(orderId, graphIsImg, worker) {
    // the id of the order the graph belongs to
    this.orderId = orderId;
    // differ between image representation and fullscreen mode
    this.graphIsImg = graphIsImg;

    // indicating whether a Petri Net is currently drawn
    this.isBusy = false;
    // the latest unseen message, null if the Petri Net is up to date
    this.nextMessage = null;
    // The nodes and edges from the previous iteration, for comparison
    this.previousNodes = [];
    this.previousEdges = [];

    // The Web Worker to parse the dotfiles
    this.dotWorker = worker;
  }
}

// update the graph visualization according to the passed dotfile
const updatePetriNet = async function (parsedDotfile, petriNetInfos) {
  // check if nodes only differ by tokens
  const nodesWithDifferentTokens = compareGraphElements(
    parsedDotfile,
    petriNetInfos
  );
  if (nodesWithDifferentTokens) {
    // just toggle the changed tokens
    flipTokensForNodeIds(nodesWithDifferentTokens);
  } else {
    // graph has changed or was not created yet
    createCodeVisualization(parsedDotfile);

    if (petriNetInfos.graphIsImg) {
      // rescale image div to fit the graph, not necessary in fullscreen mode
      await fitGraphAsImage();
    }
  }
};

// compare the elements created by two different dotfiles for equality
const compareGraphElements = function (newDotfile, petriNetInfos) {
  // check if only the tokens of some nodes were changed
  const [nodes, edges] = getElementsFromDotfile(newDotfile);
  const compNodes = petriNetInfos.previousNodes;
  const compEdges = petriNetInfos.previousEdges;
  petriNetInfos.previousNodes = nodes;
  petriNetInfos.previousEdges = edges;

  if (nodes.length != compNodes.length || edges.length != compEdges.length) {
    return false;
  }

  // compare nodes with the same ID for equality
  const nodeIdsWithChangedToken = [];
  nodes.forEach((node, index) => {
    const compNode = compNodes[index];
    if (checkEqualNodes(node, compNode)) {
      if (node.tokenLabel != compNode.tokenLabel) {
        // nodes only differ in their token labels
        nodeIdsWithChangedToken.push(node.id);
      }
    } else {
      return false;
    }
  });

  // compare edges
  if (JSON.stringify(edges) != JSON.stringify(compEdges)) {
    return false;
  }
  return nodeIdsWithChangedToken;
};

// compare two node objects for equality
const checkEqualNodes = function (node1, node2) {
  return (
    node1.id == node2.id &&
    node1.label == node2.label &&
    node1.xPosition == node2.xPosition &&
    node1.yPosition == node2.yPosition &&
    node1.order == node2.order &&
    node1.numberOfEdges == node2.numberOfEdges
  );
};

// resize the graph and it's div to improve the readability
const fitGraphAsImage = async function () {
  const cy = getCy();
  cy.fit();
  // disable graph manipulations
  cy.autoungrabify(true);
  cy.userPanningEnabled(false);
  cy.userZoomingEnabled(false);

  // ensure that the zoom level is always constanly set to 1 for a good visibility
  if (Math.abs(cy.zoom() - 1) > 0.01) {
    // graph proportions have not been adjusted yet
    cy.zoom(1);
    const newGraphSize = cy.elements().renderedBoundingBox();

    // resize the div containing the graph
    $("#cy").css("height", newGraphSize.h + "px");
    if (newGraphSize.w > $("#cy").innerWidth()) {
      // only adjust width if necessary
      $("#cy").css("width", newGraphSize.w + "px");
    }

    // delay the fit to ensure that the new div style was set first
    const numberOfNodes = Object.keys(cy.nodes()).length;
    // determine the delay per element by a good fitting log function
    const delayPerElement = Math.max(-Math.log(numberOfNodes) + 10, 0.1); // ms
    const delay = Math.max(delayPerElement * numberOfNodes, 200);
    await setTimeout(() => {
      cy.fit();
      // make it visible after the fitting is applied
      $("#cy").css("visibility", "visible");
    }, delay);
  }
};

const createPetriNet = async function (msg, petriNetInfos) {
  if (msg["order_id"] != petriNetInfos.orderId) {
    return;
  }
  // enable the graph creation code to access the dotstring and tree structure
  document.getElementById("graphElementsDiv").innerHTML = msg["content"];
  const dotfileContent = msg["content"].split("call_tree:")[0];
  // let a web worker parse the dotfile to prevent UI freeze
  petriNetInfos.dotWorker.postMessage(dotfileContent);
  // dotfile was parsed
  petriNetInfos.dotWorker.onmessage = async function (message) {
    await updatePetriNet(message.data, petriNetInfos);
    await onPetriNetDrawn(petriNetInfos);
  };
};

const onPetriNetDrawn = async function (petriNetInfos) {
  // check if a new request to draw a Petri Net arrived
  if (petriNetInfos.nextMessage) {
    const currentMessage = petriNetInfos.nextMessage;
    petriNetInfos.nextMessage = null;
    await createPetriNet(currentMessage, petriNetInfos);
  } else {
    petriNetInfos.isBusy = false;
  }
};

const onUpdateMessageReceived = function (msg, petriNetInfos) {
  if (msg["order_id"] != petriNetInfos.orderId) {
    return;
  }
  // check if another petri net is currently drawn
  if (petriNetInfos.isBusy) {
    // always safe the newest message per order id
    petriNetInfos.nextMessage = msg;
  } else {
    petriNetInfos.isBusy = true;
    createPetriNet(msg, petriNetInfos);
  }
};
