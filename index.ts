//Write n files with random data
import {
    buildTreeFromFlatList,
    countChildren, findNodes, findValues,
    flattenTree,
    TreeTransformer,
    visitTree
} from "./tree-utils";
import {match} from "ts-pattern";

//Enum for node roles, can be used in pattern matching
enum NodeRole {
    Root = "Root",
    SuperNode = "SuperNode",
    ExtendedNode = "ExtendedNode",
    SimpleNode = "SimpleNode"
}

//Sample node interface
interface SampleNode {
    role: NodeRole;
    id: number;
    parentId: number;
    name: string;
}

const data = [
    {id: 1, parentId: null, name: 'root', role: "Root"},
    {id: 2, parentId: 1, name: 'child 1', role: "ExtendedNode"},
    {id: 3, parentId: 1, name: 'child 2', role: "SimpleNode"},
    {id: 4, parentId: 2, name: 'child 1.1', role: "SimpleNode"},
    {id: 5, parentId: 2, name: 'child 1.2', role: "ExtendedNode"},
    {id: 6, parentId: 3, name: 'child 2.1', role: "SimpleNode"},
    {id: 9, parentId: 4, name: 'child 1.1.2', role: "ExtendedNode"},
    {id: 8, parentId: 4, name: 'child 1.1.1', role: "SimpleNode"},
    {id: 7, parentId: 3, name: 'child 2.2', role: "SuperNode"},
    {id: 10, parentId: 4, name: 'child 1.1.3', role: "SimpleNode"},
    {id: 11, parentId: 4, name: 'child 1.1.4', role: "SimpleNode"},
];

//Pattern matching
const nodeInfo = (node: SampleNode) => match(node)
    .with({role: NodeRole.SuperNode}, () => "I'm Super")
    .with({role: NodeRole.ExtendedNode}, () => "I'm Extended")
    .with({role: NodeRole.SimpleNode}, () => "I'm Simple")
    .with({role: NodeRole.Root}, () => "I'm Root")
    .exhaustive();

const nodeTree = (data: any[]) => buildTreeFromFlatList<SampleNode, String>(
    data, null, x => x.id, x => x.parentId, x => {
        return {
            id: x.id,
            parentId: x.parentId,
            name: x.name,
            role: x.role
        }
    }
);

//Wrapper for node, can be used to add additional properties to node
interface NodeIdWrapper<T> {
    newId: number;
    payload: T;
}

//Tree building for WrapperNode
const wrapperTree = (data: any[]) => buildTreeFromFlatList<NodeIdWrapper<SampleNode>, String>(
    data, null, x => x.id, x => x.parentId, x => {
        return {
            newId: null,
            payload: x
        }
    }
);


//Tree traversal with a visitor
visitTree(nodeTree(data), {
    visitValue: (node, parents, index) => {
        console.log('node', index, nodeInfo(node), parents.map(x => nodeInfo(x)));
    }
});

//Tree traversal with a visitor
visitTree(wrapperTree(data), {
    visitValue: (node, parents) => {
        console.log(nodeInfo(node.payload), parents.map(x => nodeInfo(x.payload)));
    }
});



console.log("findValuesInNodeTree", findValues(nodeTree(data), x => x.role === NodeRole.ExtendedNode));

console.log("findValuesInWrapperTree", findValues(wrapperTree(data), x => x.payload.role === NodeRole.ExtendedNode).map(x => x.payload));
console.log("findNodes", findNodes(nodeTree(data), x => x.role === NodeRole.ExtendedNode));
console.log("count all", countChildren(nodeTree(data)));

//Tree transformation, compute new id
function computeNewId(node: NodeIdWrapper<SampleNode>, parents: NodeIdWrapper<SampleNode>[], index: number) {
    return match(node.payload.role)
        .with(NodeRole.Root, () => 0)
        .with(NodeRole.SuperNode, () => node.payload.id * 10 + index)
        .with(NodeRole.ExtendedNode, () => node.payload.id * 100 + index)
        .with(NodeRole.SimpleNode, () => node.payload.id * 1000 + index)
        .exhaustive();
    //return node.payload.id * 10 + index;
}

function getParentId(node: NodeIdWrapper<SampleNode>, parents: NodeIdWrapper<SampleNode>[]): number | null {
    return parents.length > 0 ? parents[parents.length - 1].newId : null;
}

const transformer: TreeTransformer<NodeIdWrapper<SampleNode>, SampleNode> = {
    transform: (node, parents, index) => {
        node.newId = computeNewId(node, parents, index);
        return {
            ...node.payload, ...{id: node.newId, parentId: getParentId(node, parents)}
        }
    }
}

const newList = flattenTree(wrapperTree(data), transformer);

console.log(newList);