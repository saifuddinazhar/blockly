/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview The class representing a basic cursor.
 * Used to demo switching between different cursors.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */
'use strict';


/**
 * Class for a basic cursor.
 * This will allow the user to get to all nodes in the AST by hitting next or
 * previous.
 * @constructor
 * @extends {Blockly.Cursor}
 */
Blockly.LineCursor = function() {
  Blockly.LineCursor.superClass_.constructor.call(this);
};
Blockly.utils.object.inherits(Blockly.LineCursor, Blockly.Cursor);

/**
 * Decides what nodes to traverse and which ones to skip. Currently, it
 * skips output, stack and workspace nodes.
 * @param {Blockly.ASTNode} node The AST node to check whether it is valid.
 * @return {boolean} True if the node should be visited, false otherwise.
 * @private
 */
Blockly.LineCursor.prototype.validNode_ = function(node) {
  if (!node) {
    return false;
  }
  var isValid = false;
  var location = node.getLocation();
  var type = node && node.getType();
  if (type == Blockly.ASTNode.types.BLOCK) {
    if (location.outputConnection === null) {
      isValid = true;
    }
  }
  return isValid;
};

Blockly.LineCursor.prototype.validInNode_ = function(node) {
  if (!node) {
    return false;
  }
  var isValid = false;
  var location = node.getLocation();
  var type = node && node.getType();
  if (type == Blockly.ASTNode.types.FIELD) {
      isValid = true;
  }
  return isValid;
};

/**
 * From the given node find either the next valid sibling or parent.
 * @param {Blockly.ASTNode} node The current position in the AST.
 * @return {Blockly.ASTNode} The parent AST node or null if there are no
 *     valid parents.
 * @private
 */
Blockly.LineCursor.prototype.findSiblingOrParent_ = function(node) {
  if (!node) {
    return null;
  }
  var nextNode = node.next();
  if (nextNode) {
    return nextNode;
  }
  return this.findSiblingOrParent_(node.out());
};

/**
 * Uses pre order traversal to navigate the Blockly AST. This will allow
 * a user to easily navigate the entire Blockly AST without having to go in
 * and out levels on the tree.
 * @param {Blockly.ASTNode} node The current position in the AST.
 * @return {Blockly.ASTNode} The next node in the traversal.
 * @private
 */
Blockly.LineCursor.prototype.getNextNode_ = function(node, isValid) {
  if (!node) {
    return null;
  }
  var newNode = node.in() || node.next();
  if (isValid(newNode)) {
    return newNode;
  } else if (newNode) {
    return this.getNextNode_(newNode, isValid);
  }
  var siblingOrParent = this.findSiblingOrParent_(node.out());
  if (isValid(siblingOrParent)) {
    return siblingOrParent;
  } else if (siblingOrParent) {
    return this.getNextNode_(siblingOrParent, isValid);
  }
  return null;
};

/**
 * Get the right most child of a node.
 * @param {Blockly.ASTNode} node The node to find the right most child of.
 * @return {Blockly.ASTNode} The right most child of the given node, or the node
 *     if no child exists.
 * @private
 */
Blockly.LineCursor.prototype.getRightMostChild_ = function(node) {
  if (!node.in()) {
    return node;
  }
  var newNode = node.in();
  while (newNode.next()) {
    newNode = newNode.next();
  }
  return this.getRightMostChild_(newNode);

};

/**
 * Reverses the pre order traversal in order to find the previous node. This will
 * allow a user to easily navigate the entire Blockly AST without having to go in
 * and out levels on the tree.
 * @param {Blockly.ASTNode} node The current position in the AST.
 * @return {Blockly.ASTNode} The previous node in the traversal or null if no
 *     previous node exists.
 * @private
 */
Blockly.LineCursor.prototype.getPreviousNode_ = function(node, isValid) {
  if (!node) {
    return null;
  }
  var newNode = node.prev();

  if (newNode) {
    newNode = this.getRightMostChild_(newNode);
  } else {
    newNode = node.out();
  }
  if (isValid(newNode)) {
    return newNode;
  } else if (newNode) {
    return this.getPreviousNode_(newNode, isValid);
  }
  return null;
};

/**
 * Find the next node in the pre order traversal.
 * @return {Blockly.ASTNode} The next node, or null if the current node is
 *     not set or there is no next value.
 * @override
 */
Blockly.LineCursor.prototype.next = function() {
  var curNode = this.getCurNode();
  if (!curNode) {
    return null;
  }
  var newNode = this.getNextNode_(curNode, this.validNode_);

  if (newNode) {
    this.setCurNode(newNode);
  }
  return newNode;
};

/**
 * For a basic cursor we only have the ability to go next and previous, so
 * in will also allow the user to get to the next node in the pre order traversal.
 * @return {Blockly.ASTNode} The next node, or null if the current node is
 *     not set or there is no next value.
 * @override
 */
Blockly.LineCursor.prototype.in = function() {
  var curNode = this.getCurNode();
  if (!curNode) {
    return null;
  }
  var newNode = this.getNextNode_(curNode, this.validInNode_);

  if (newNode) {
    this.setCurNode(newNode);
  }
  return newNode;
};

/**
 * Find the previous node in the pre order traversal.
 * @return {Blockly.ASTNode} The previous node, or null if the current node
 *     is not set or there is no previous value.
 * @override
 */
Blockly.LineCursor.prototype.prev = function() {
  var curNode = this.getCurNode();
  if (!curNode) {
    return null;
  }
  var newNode = this.getPreviousNode_(curNode, this.validNode_);
  
  if (newNode) {
    this.setCurNode(newNode);
  }
  return newNode;
};

/**
 * For a basic cursor we only have the ability to go next and previou, so
 * out will allow the user to get to the previous node in the pre order traversal.
 * @return {Blockly.ASTNode} The previous node, or null if the current node is
 *     not set or there is no previous value.
 * @override
 */
Blockly.LineCursor.prototype.out = function() {
  var curNode = this.getCurNode();
  if (!curNode) {
    return null;
  }
  var newNode = this.getPreviousNode_(curNode, this.validInNode_);

  if (newNode) {
    this.setCurNode(newNode);
  }
  return newNode;

};
