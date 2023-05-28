/**
 * Tree Node interface
 * @param value - value of the node
 * @param children - children of the node
 */
export interface TreeNode<T> {
    value: T;
    children?: TreeNode<T>[];
}

/**
 * Build tree list from flat list of nodes
 * @param nodes - flat list of nodes
 * @param parentId - parent id of the root node
 * @param idSelector - function to get id from node
 * @param parentIdSelector - function to get parent id from node
 * @param provider - function to create node value from node
 * @return - list of root nodes
 */
export function buildTreesFromFlatList<T, K>(
    nodes: any[],
    parentId: K,
    idSelector: (any) => K,
    parentIdSelector: (any) => K,
    provider: (any) => T): TreeNode<T>[] {
    return nodes.filter(x => parentIdSelector(x) === parentId)
        .map(x => ({
                value: provider(x),
                children: buildTreesFromFlatList(nodes, idSelector(x), idSelector, parentIdSelector, provider)
            }
        ));
}

/**
 * Build tree from flat list of nodes
 * @param nodes - flat list of nodes
 * @param parentId - parent id of the root node
 * @param idSelector - function to get id from node
 * @param parentIdSelector - function to get parent id from node
 * @param provider - function to create node value from node
 * @return - root node
 */
export function buildTreeFromFlatList<T, K>(
    nodes: any[],
    parentId: K,
    idSelector: (any) => K,
    parentIdSelector: (any) => K,
    provider: (any) => T): TreeNode<T> {
    return buildTreesFromFlatList(nodes, parentId, idSelector, parentIdSelector, provider)[0];
}


/**
 * Tree visitor with parents
 * @param node - current node
 * @param parents - parents of the current node
 */
export interface ValueVisitorWithParents<T> {
    visitValue(node: T, parents: T[], index: number);
}

 export interface NodeVisitorWithParents<T> {
     visitNode(node: TreeNode<T>, parents: TreeNode<T>[], index: number);
 }

 type VisitorWithParents<T> = ValueVisitorWithParents<T> | NodeVisitorWithParents<T>;

function isNodeVisitor<T>(visitor: VisitorWithParents<T>): visitor is NodeVisitorWithParents<T> { //magic happens here
    return (visitor as NodeVisitorWithParents<T>).visitNode !== undefined;
}

/**
 * Tree transformer
 * @param node - current node
 * @param parents - parents of the current node
 * @return - transformed node
 */
export interface TreeTransformer<T, K> {
    transform(node: T, parents: T[], index: number): K;
}



/**
 * Visit tree with visitor function and parents
 * @param node - root node
 * @param visitor - visitor function
 */
export function visitTree<T>(node: TreeNode<T>, visitor: VisitorWithParents<T>) {
    function visitTreeInternal<T>(node: TreeNode<T>, parents: TreeNode<T>[], index: number, visitor: VisitorWithParents<T>) {
        if (isNodeVisitor(visitor)) {
            visitor.visitNode(node, parents, index);
        } else {
            visitor.visitValue(node.value, parents.map(x => x.value), index);
        }

        if (node.children) {
            node.children.forEach((x, i) => visitTreeInternal(x, [...parents, node], i, visitor));
        }
    }
    visitTreeInternal(node, [], 0, visitor);
}

/**
 * Flatten tree with transformer function
 * @param node - root node
 * @param transformer - transformer function
 * @return - flattened tree
 */
export function flattenTree<T, K>(node: TreeNode<T>, transformer: TreeTransformer<T, K>): K[] {
    const result: K[] = [];
    const visitor: ValueVisitorWithParents<T> = {
        visitValue: (node, parents, i) => {
            result.push(transformer.transform(node, parents, i));
        }
    }
    visitTree(node, visitor);
    return result;
}

export function findNodes<T>(node: TreeNode<T>, predicate: (T) => boolean): TreeNode<T>[] {
    let results: TreeNode<T>[] = [];
    visitTree(node, {
        visitNode: (node) => {
            if (predicate(node.value)) {
                results.push(node);
            }
        }
    });
    return results;
}

export function findValues<T>(node: TreeNode<T>, predicate: (T) => boolean): T[] {
    let results: T[] = [];
    visitTree(node, {
        visitValue: (value) => {
            if (predicate(value)) {
                results.push(value);
            }
        }
    });
    return results;
}

export function countChildren<T>(node: TreeNode<T>, filter: (T) => boolean = null): number {
    if (node.children) {
        return node.children
            .filter(x => filter ? filter(x.value) : true)
            .map(x => 1 + countChildren(x)).
            reduce((x, y) => x + y, 0);
    } else {
        return 0;
    }
}

