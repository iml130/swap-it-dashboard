// SPDX-FileCopyrightText: The SWAP-IT Dashboard Contributors
// SPDX-License-Identifier: MIT

// a script to be executed by a Web Worker thread to parse a dotfile string into a JSON object
onmessage = function (dotfileMessage) {
  let dotfileContent = dotfileMessage.data;

  // remove unwanted characters from dotfile
  dotfileContent = dotfileContent.replace(/[\n]/g, "");
  dotfileContent = dotfileContent.replace(/[\\]/g, "");
  dotfileContent = dotfileContent.replace(/&bull;/g, "•");

  const parse = require("dotparser");
  const parsedDotfile = parse(dotfileContent)[0];

  // return the parsed dotfile to the main thread
  postMessage(parsedDotfile);
};
