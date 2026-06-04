import { v4 as uuidv4 } from 'uuid';

// export const mergeData = (treeData: any) => {
//   const dataById: any = {};

//   // Step 1: Store all nodes in a map
//   treeData.forEach((item: any) => {
//     dataById[item.id] = { ...item, onSuccess: null, onFailure: null };
//   });

//   // Step 2: Attach onSuccess and onFailure to their respective parents
//   treeData.forEach((item: any) => {
//     if (item.parentId) {
//       const parent = dataById[item.parentId];
//       if (parent) {
//         if (item.rowType === "onSuccess") {
//           parent.onSuccess = mergeDataRecursive(item, dataById);
//         } else if (item.rowType === "onFailure") {
//           parent.onFailure = mergeDataRecursive(item, dataById);
//         }
//       }
//     }
//   });

//   // Step 3: Return the root node
//   const rootNode = treeData.find((item: any) => !item.parentId);
//   return rootNode ? dataById[rootNode.id] : null;
// };


export const mergeData = (treeData: any[]) => {
  const dataById: Record<string, any> = {};

  // Step 1: Store all nodes in a map and initialize children
  treeData.forEach((item) => {
    dataById[item?.id] = { ...item, onSuccess: null, onFailure: null };
  });

  // Step 2: Recursive function to attach child nodes
  const mergeDataRecursive = (node: any) => {
    if (!node) return null;

    // Find all children of the current node
    const children = treeData?.filter((child) => child?.parentId === node?.id);

    // Attach children based on rowType
    children.forEach((child) => {
      if (child?.rowType === "onSuccess") {
        node.onSuccess = mergeDataRecursive(child);
      } else if (child?.rowType === "onFailure") {
        node.onFailure = mergeDataRecursive(child);
      }
    });

    return node;
  };

  // Step 3: Find all root nodes (nodes with no parent)
  const rootNodes = treeData?.filter((item) => !item.parentId);

  // Step 4: Process each root node and return the tree structure
  return rootNodes.map((rootNode) => mergeDataRecursive(rootNode));
};


const mergeDataRecursive = (node: any, dataById: any) => {
  const clonedNode = { ...node, onSuccess: null, onFailure: null };

  Object.values(dataById).forEach((child: any) => {
    if (child.parentId === node.id) {
      if (child.rowType === "onSuccess") {
        clonedNode.onSuccess = mergeDataRecursive(child, dataById);
      } else if (child.rowType === "onFailure") {
        clonedNode.onFailure = mergeDataRecursive(child, dataById);
      }
    }
  });

  return clonedNode;
};


export const splitMergedData = (mergedData: any[]) => {
  const result: any[] = [];

  const processNode = (node: any, parentId: string | null = null) => {
    const { onSuccess, onFailure, ...nodeData } = node;

    // Ensure node has an ID
    const newNode = { ...nodeData, id: node.id || uuidv4(), parentId };
    result.push(newNode);

    // Process onSuccess if it's a valid object
    if (onSuccess && Object.keys(onSuccess).length > 0) {
      processNode(
        { ...onSuccess, rowType: "onSuccess", parentId: newNode.id, id: onSuccess.id || uuidv4() },
        newNode.id
      );
    }

    // Process onFailure if it's a valid object
    if (onFailure && Object.keys(onFailure).length > 0) {
      processNode(
        { ...onFailure, rowType: "onFailure", parentId: newNode.id, id: onFailure.id || uuidv4() },
        newNode.id
      );
    }
  };

  mergedData.forEach((node) => processNode(node));

  return result;
};


export interface IConditionBuilderProps {
  config: any;
  SubscriptionList: any[];
  data: any[];
  onCallback: (result: any) => void;
}
 export interface TreeNode {
  id: string;
  Key: string;
  Value: string;
  Type: string;
  IsResolved: boolean;
  conditions: Record<string, any>;
  rowType: string;
  parentId: string | null;
  onSuccess: Record<string, any>;
  onFailure: Record<string, any>;
}