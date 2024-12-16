class Token {
    constructor(type, value) {
      this.type = type;
      this.value = value;
      this.right;
      this.left;
      this.children = []; // Allow multiple children
    }
  }
  
  class Tokens {
    constructor() {
      this.head = null; // The first token
      this.tail = null; // The last token
    }
  
    push(token) {
      if (!this.head) {
        this.head = this.tail = token;
      } else {
        this.tail.right = token;
        token.left = this.tail;
        this.tail = token;
      }
    }
  
    traverse() {
      let current = this.head;
      const tokens = [];
      while (current) {
        tokens.push({ type: current.type, value: current.value });
        current = current.right;
      }
      return tokens;
    }
  }
  
  // ======================================== TOKEN TYPES ======================================== 
  const TOKEN_REGEX = [
    { regex: /^\d+(\.\d+)?/, type: "NUMBER" }, // Integer or decimal number
    { regex: /^[+\-*/]/, type: "OPERATOR" }, // Basic operators
    { regex: /^[()]/, type: "PARENTHESIS" }, // Parentheses
    { regex: /^\^/, type: "POWER" }, // Power operator
    { regex: /^!/, type: "FACTORIAL" }, // Factorial operator
    { regex: /^\bsin\b/, type: "FUNCTION" }, // Sine function
    { regex: /^\bcos\b/, type: "FUNCTION" }, // Cosine function
    { regex: /^\s+/, type: null }, // Whitespace (ignored)
  ];

  // ======================================== TOKENIZE FUNCTION ======================================== 
  function tokenize(expression) {
    const tokens = new Tokens();
    let position = 0;
  
    while (position < expression.length) {
      let matchFound = false;
  
      for (const { regex, type } of TOKEN_REGEX) {
        const match = expression.slice(position).match(regex);
        if (match) {
          if (type) {
            const token = new Token(type, match[0]);
            tokens.push(token);
          }
          position += match[0].length;
          matchFound = true;
          break;
        }
      }
  
      if (!matchFound) {
        throw new Error(`Unexpected character: ${expression[position]}`);
      }
    }
  
    return tokens;
  }
  

  // ======================================== SYNTAX ANALYZE FUNCTION ======================================== 
  // grammar
  // E -> E + T | E - T | T
  // T -> T * F | T / F | F ^ F | F
  // F -> F ! | sin ( E ) | cos ( E ) | ( E ) | number
function syntaxAnalyze(tokens) {
  let current = tokens.head; // Start with the head of the token list

 
  function parseExpression() {
    let node = parseTerm();

    while (current && current.type === "OPERATOR" && (current.value === "+" || current.value === "-")) {
      const operator = current;
      current = current.right;
      console.log(current)
      const rightNode = parseTerm();
      const newNode = new Token(operator.type, operator.value);
      newNode.children.push(node, rightNode);
      node = newNode;
    }

    return node;
  }

  function parseTerm() {
    let node = parseFactor();

    while (current && current.type === "POWER") {
      const operator = current;
      current = current.right;
      const rightNode = parseFactor();
      const newNode = new Token(operator.type, operator.value);
      newNode.children.push(node, rightNode);
      node = newNode;
    }

    while (current && current.type === "OPERATOR" && (current.value === "*" || current.value === "/")) {
      const operator = current;
      current = current.right;
      const rightNode = parseFactor();
      const newNode = new Token(operator.type, operator.value);
      newNode.children.push(node, rightNode);
      node = newNode;
    }

    return node;
  }

  function parseFactor() {
    if (!current) {
      throw new Error("Unexpected end of input");
    }

    if (current.type === "NUMBER") {
      const { value, type } = current;
      current = current.right;

      let node = new Token(type, value);

      // Handle postf ix factorial
      while (current && current.type === "FACTORIAL") {
        const factorialToken = current;
        current = current.right;
        const newNode = new Token(factorialToken.type, factorialToken.value);
        newNode.children.push(node);
        node = newNode;
      }

      return node;
    }

    if (current.type === "FUNCTION") {
      const functionToken = current;
      current = current.right;

      if (!current || current.type !== "PARENTHESIS" || current.value !== "(") {
        throw new Error(`Expected '(' after function '${functionToken.value}'`);
      }

      current = current.right; // Move past '('
      const argumentNode = parseExpression();

      if (!current || current.type !== "PARENTHESIS" || current.value !== ")") {
        throw new Error(`Expected ')' after function argument`);
      }

      current = current.right; // Move past ')'

      const functionNode = new Token(functionToken.type, functionToken.value);
      functionNode.children.push(argumentNode);
      return functionNode;
    }

    if (current.type === "PARENTHESIS" && current.value === "(") {
      current = current.right; // Move past '('
      const node = parseExpression();

      if (!current || current.type !== "PARENTHESIS" || current.value !== ")") {
        throw new Error("Expected closing parenthesis");
      }

      current = current.right; // Move past ')'
      return node;
    }

    throw new Error(`Unexpected token: ${current.value}`);
  }

  const parseTree = parseExpression();

  if (current) {
    throw new Error(`Unexpected token at the end of input: ${current.value}`);
  }

  return parseTree;
}

  
  // ======================================== EVULATE FUNCTION ======================================== 
  function evaluate(node) {
    if (node.type === "NUMBER") {
      return parseFloat(node.value);
    }
  
    if (node.type === "FUNCTION") {
      const argumentValue = evaluate(node.children[0]);
  
      switch (node.value) {
        case "sin":
          return Math.sin(argumentValue);
        case "cos":
          return Math.cos(argumentValue);
        default:
          throw new Error(`Unknown function: ${node.value}`);
      }
    }
  
    if (node.type === "FACTORIAL") {
      const value = evaluate(node.children[0]);
  
      if (!Number.isInteger(value) || value < 0) {
        throw new Error("Factorial is defined for non-negative integers only");
      }
  
      return factorial(value); // Use a helper function for factorial
    }
  
    const leftValue = evaluate(node.children[0]);
    const rightValue = node.children.length > 1 ? evaluate(node.children[1]) : null;
  
    switch (node.value) {
      case "+":
        return leftValue + rightValue;
      case "-":
        return leftValue - rightValue;
      case "*":
        return leftValue * rightValue;
      case "/":
        return leftValue / rightValue;
      case "^":
        return Math.pow(leftValue, rightValue);
      default:
        throw new Error(`Unknown operator: ${node.value}`);
    }
  }
  
// FACTORIAL FUNCTION
  function factorial(n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
  }
  
  // ======================================== DRAW TREE FUNCTIONS  ======================================== 
  
  function createVisTree(node, nodes = [], edges = [], parentId = null) {
    if (!node) return;
  
    // Create a unique ID for the current node
    const nodeId = nodes.length;
  
    // Add the current node to the nodes array
    nodes.push({ id: nodeId, label: `${node.value}\n(${node.type})` });
  
    // Add an edge connecting the parent to the current node (if there's a parent)
    if (parentId !== null) {
      edges.push({ from: parentId, to: nodeId });
    }
  
    // Recursively process all children
    node.children.forEach((child) => {
      createVisTree(child, nodes, edges, nodeId);
    });
  
    return { nodes, edges };
  }
  
  function drawParseTree(treeRoot) {
    const { nodes, edges } = createVisTree(treeRoot);
  
    // Configure the network visualization
   
    const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
    const options = {
      layout: {
        hierarchical: {
          direction: "UD", // Up-Down layout
          sortMethod: "directed",
        },
      },
      edges: {
        arrows: { to: { enabled: false } },
      },
    };
  
    // Create and render the network
    new vis.Network(parseTreeContainer, data, options);
  }
  
  function drawTokens(tokens) {
    const nodes = [];
    const edges = [];
  
    // Add each token as a node
    tokens.forEach((token, index) => {
      nodes.push({
        id: index,
        label: `${token.value}\n(${token.type})`,
        x: index * 150, // Space nodes horizontally
        y: 0, // Keep all nodes in the same row
        physics: false, // Disable physics for fixed positioning
      });
  
      // Connect sequential tokens with edges
      if (index > 0) {
        edges.push({ from: index - 1, to: index });
      }
    });
  
    // Render the graph using vis.js
    const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
    const options = {
      layout: {
        hierarchical: false, // Linear layout
      },
      edges: {
        arrows: { to: { enabled: false } }, // No arrows for linear token display
      },
    };
  
    new vis.Network(tokensContainer, data, options);
  }
  

  const tokensContainer = document.getElementById("tokensTree");
  const parseTreeContainer = document.getElementById("parseTree");
  // ======================================== BUTTON FUNCTION ======================================== 
  function evaluateExpression() {
    console.log("test")
    const input = document.getElementById("expression").value;
    const outputDiv = document.getElementById("output");
  
    try {
      const tokens = tokenize(input);
      drawTokens(tokens.traverse());
      const parseTree = syntaxAnalyze(tokens);
      const result = evaluate(parseTree);
      outputDiv.textContent = `Result: ${result}`;
  
      // Draw the parse tree
      drawParseTree(parseTree);
    } catch (error) {
      outputDiv.textContent = `Error: ${error.message}`;
      // tokensContainer.innerHTML = ""ö
      parseTreeContainer.innerHTML = "";
    }
  }
  


  