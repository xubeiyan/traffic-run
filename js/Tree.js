import * as THREE from "./three.module.js";
import { pickRandom } from './tools.js';

// 树
const treeCrownColor = 0x498c2c;
const treeTrunkColor = 0x4b3f2f;

const treeTrunkGeometry = new THREE.BoxBufferGeometry(15, 15, 30);
const treeTrunkMaterial = new THREE.MeshLambertMaterial({
  color: treeTrunkColor,
});
const treeCrownMaterial = new THREE.MeshLambertMaterial({
  color: treeCrownColor,
});

const Tree = () => {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(treeTrunkGeometry, treeTrunkMaterial);
  trunk.position.z = 10;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  trunk.matrixAutoUpdate = false;
  tree.add(trunk);

  const treeHeights = [45, 60, 75];
  const height = pickRandom(treeHeights);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(height / 2, 30, 30),
    treeCrownMaterial
  );
  crown.position.z = height / 2 + 30;
  crown.castShadow = true;
  crown.receiveShadow = false;
  tree.add(crown);

  return tree;
};

// 添加树
const addTrees = (scene, arcCenterX) => {
  const tree1 = Tree();
  tree1.position.x = arcCenterX * 1.3;
  scene.add(tree1);

  const tree2 = Tree();
  tree2.position.y = arcCenterX * 1.9;
  tree2.position.x = arcCenterX * 1.3;
  scene.add(tree2);

  const tree3 = Tree();
  tree3.position.x = arcCenterX * 0.8;
  tree3.position.y = arcCenterX * 2;
  scene.add(tree3);

  const tree4 = Tree();
  tree4.position.x = arcCenterX * 1.8;
  tree4.position.y = arcCenterX * 2;
  scene.add(tree4);

  const tree5 = Tree();
  tree5.position.x = -arcCenterX * 1;
  tree5.position.y = arcCenterX * 2;
  scene.add(tree5);

  const tree6 = Tree();
  tree6.position.x = -arcCenterX * 2;
  tree6.position.y = arcCenterX * 1.8;
  scene.add(tree6);

  const tree7 = Tree();
  tree7.position.x = arcCenterX * 0.8;
  tree7.position.y = -arcCenterX * 2;
  scene.add(tree7);

  const tree8 = Tree();
  tree8.position.x = arcCenterX * 1.8;
  tree8.position.y = -arcCenterX * 2;
  scene.add(tree8);

  const tree9 = Tree();
  tree9.position.x = -arcCenterX * 1;
  tree9.position.y = -arcCenterX * 2;
  scene.add(tree9);

  const tree10 = Tree();
  tree10.position.x = -arcCenterX * 2;
  tree10.position.y = -arcCenterX * 1.8;
  scene.add(tree10);

  const tree11 = Tree();
  tree11.position.x = arcCenterX * 0.6;
  tree11.position.y = -arcCenterX * 2.3;
  scene.add(tree11);

  const tree12 = Tree();
  tree12.position.x = arcCenterX * 1.5;
  tree12.position.y = -arcCenterX * 2.4;
  scene.add(tree12);

  const tree13 = Tree();
  tree13.position.x = -arcCenterX * 0.7;
  tree13.position.y = -arcCenterX * 2.4;
  scene.add(tree13);

  const tree14 = Tree();
  tree14.position.x = -arcCenterX * 1.5;
  tree14.position.y = -arcCenterX * 1.8;
  scene.add(tree14);
};


export {addTrees};