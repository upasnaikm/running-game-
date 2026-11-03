/**
 * NEON PULSE: CYBER RUNNER 3D
 * Track & 4 Distinct Endless Game Worlds System:
 * 1. Realistic Bright Jungle
 * 2. Realistic Ice Cream Land
 * 3. Realistic Bright Road Land
 * 4. Horror World
 */

class TrackManager {
    constructor(scene, initialWorld = 'jungle') {
        this.scene = scene;
        this.currentWorld = initialWorld;
        this.chunkLength = 35;
        this.chunkCount = 12; // 420 units visible ahead
        this.chunks = [];
        this.furthestZ = 0;

        // Dynamic Lighting & Fog references
        this.ambientLight = null;
        this.dirLight = null;

        this._initLightingAndFog();
        this._buildInitialTrack();
    }

    setWorld(worldName) {
        if (worldName === this.currentWorld) return;
        this.currentWorld = worldName;

        // Update lighting & fog
        this._updateAtmosphere();

        // Rebuild all chunks for the new world
        for (const chunk of this.chunks) {
            this.scene.remove(chunk);
            this._disposeGroup(chunk);
        }
        this.chunks = [];
        this._buildInitialTrack();
    }

    _initLightingAndFog() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.dirLight.position.set(20, 45, 10);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 1024;
        this.dirLight.shadow.mapSize.height = 1024;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 140;
        this.dirLight.shadow.camera.left = -25;
        this.dirLight.shadow.camera.right = 25;
        this.dirLight.shadow.camera.top = 25;
        this.dirLight.shadow.camera.bottom = -25;
        this.scene.add(this.dirLight);
        this.scene.add(this.dirLight.target);

        this._updateAtmosphere();
    }

    _updateAtmosphere() {
        const w = this.currentWorld;
        if (w === 'jungle') {
            this.scene.fog = new THREE.Fog(0x1a3824, 45, 260);
            this.scene.background = new THREE.Color(0x326442);
            this.ambientLight.color.setHex(0x5ca868);
            this.ambientLight.intensity = 1.3;
            this.dirLight.color.setHex(0xfff6c8); // Golden sunlight
            this.dirLight.intensity = 1.8;
        } else if (w === 'candy') {
            this.scene.fog = new THREE.Fog(0xffdbee, 60, 280);
            this.scene.background = new THREE.Color(0xffc5e3);
            this.ambientLight.color.setHex(0xffebf4);
            this.ambientLight.intensity = 1.4;
            this.dirLight.color.setHex(0xfff3c4);
            this.dirLight.intensity = 1.7;
        } else if (w === 'road') {
            this.scene.fog = new THREE.Fog(0x8ec2ec, 65, 320);
            this.scene.background = new THREE.Color(0x62a8e8);
            this.ambientLight.color.setHex(0x88b0d4);
            this.ambientLight.intensity = 1.25;
            this.dirLight.color.setHex(0xffffff);
            this.dirLight.intensity = 1.8;
        } else if (w === 'horror') {
            this.scene.fog = new THREE.Fog(0x0a0512, 30, 190);
            this.scene.background = new THREE.Color(0x0e0719);
            this.ambientLight.color.setHex(0x341d48);
            this.ambientLight.intensity = 0.9;
            this.dirLight.color.setHex(0x9a88cc); // Pale moonlight
            this.dirLight.intensity = 1.2;
        }
    }

    _buildInitialTrack() {
        for (let i = 0; i < this.chunkCount; i++) {
            const z = 20 - (i * this.chunkLength);
            const chunk = this._createTrackChunk(z, i === 0);
            this.chunks.push(chunk);
            this.scene.add(chunk);
            this.furthestZ = z;
        }
    }

    _createTrackChunk(zPos, isFirst = false) {
        const chunk = new THREE.Group();
        chunk.position.z = zPos;

        const w = this.currentWorld;

        // 1. Road Materials per World
        let roadColor, roadRough, roadMetal, dividerColor, curbColor, railColor;
        if (w === 'jungle') {
            roadColor = 0x3d3526; // Ancient earthy stone
            roadRough = 0.85; roadMetal = 0.1;
            dividerColor = 0x5a7d36; // Mossy stone dashes
            curbColor = 0x4a3f2c; railColor = 0x228b22;
        } else if (w === 'candy') {
            roadColor = 0xff7aa2; // Strawberry cream
            roadRough = 0.4; roadMetal = 0.1;
            dividerColor = 0xffffff; // White vanilla icing
            curbColor = 0xffffff; railColor = 0xd90429; // Candy cane
        } else if (w === 'road') {
            roadColor = 0x181c24; // Real dark asphalt
            roadRough = 0.7; roadMetal = 0.2;
            dividerColor = 0xf0f4f8; // Crisp white paint
            curbColor = 0x7f8c8d; railColor = 0x00f3ff;
        } else if (w === 'horror') {
            roadColor = 0x100b17; // Cursed cobblestone
            roadRough = 0.9; roadMetal = 0.3;
            dividerColor = 0x9b5de5; // Glowing purple rune line
            curbColor = 0x241b30; railColor = 0x6a0dad;
        }

        // Road Surface
        const roadGeom = new THREE.BoxGeometry(10, 0.4, this.chunkLength);
        const roadMat = new THREE.MeshStandardMaterial({
            color: roadColor,
            roughness: roadRough,
            metalness: roadMetal
        });
        const roadMesh = new THREE.Mesh(roadGeom, roadMat);
        roadMesh.position.y = -0.2;
        roadMesh.receiveShadow = true;
        chunk.add(roadMesh);

        // Lane Dividers (X = -1.4 and X = +1.4)
        const lineGeom = new THREE.BoxGeometry(0.14, 0.05, 4.0);
        const lineMat = new THREE.MeshStandardMaterial({
            color: dividerColor,
            emissive: dividerColor,
            emissiveIntensity: w === 'horror' ? 0.9 : 0.4
        });

        for (let i = 0; i < 4; i++) {
            const zOff = -this.chunkLength / 2 + (i * 8.5) + 4;
            const lineL = new THREE.Mesh(lineGeom, lineMat);
            lineL.position.set(-1.4, 0.02, zOff);
            chunk.add(lineL);

            const lineR = new THREE.Mesh(lineGeom, lineMat);
            lineR.position.set(1.4, 0.02, zOff);
            chunk.add(lineR);
        }

        // Side Curbs & Rails
        const curbGeom = new THREE.BoxGeometry(0.5, 0.6, this.chunkLength);
        const curbMat = new THREE.MeshStandardMaterial({ color: curbColor, roughness: 0.6 });
        const curbL = new THREE.Mesh(curbGeom, curbMat);
        curbL.position.set(-5.1, 0.1, 0);
        chunk.add(curbL);

        const curbR = new THREE.Mesh(curbGeom, curbMat);
        curbR.position.set(5.1, 0.1, 0);
        chunk.add(curbR);

        // Rail Trim
        const railGeom = new THREE.BoxGeometry(0.1, 0.12, this.chunkLength);
        const railMat = new THREE.MeshStandardMaterial({
            color: railColor,
            emissive: railColor,
            emissiveIntensity: 0.6
        });
        const rL = new THREE.Mesh(railGeom, railMat);
        rL.position.set(-4.85, 0.4, 0);
        chunk.add(rL);
        const rR = new THREE.Mesh(railGeom, railMat);
        rR.position.set(4.85, 0.4, 0);
        chunk.add(rR);

        // World-Specific Scenery Props
        this._populateWorldScenery(chunk, isFirst);

        return chunk;
    }

    _populateWorldScenery(chunk, isFirst) {
        const w = this.currentWorld;

        if (w === 'jungle') {
            this._populateJungleProps(chunk);
        } else if (w === 'candy') {
            this._populateCandyProps(chunk);
        } else if (w === 'road') {
            this._populateRoadProps(chunk);
        } else if (w === 'horror') {
            this._populateHorrorProps(chunk);
        }

        // Overhead Bridge / Arch (Occasional)
        if (!isFirst && Math.random() < 0.35) {
            const arch = this._createWorldArch();
            arch.position.set(0, 0, (Math.random() - 0.5) * 8);
            chunk.add(arch);
        }
    }

    // 1. Jungle World Props (Palms, ancient pillars, ferns)
    _populateJungleProps(chunk) {
        for (let i = 0; i < 3; i++) {
            const z = -this.chunkLength / 2 + (i * 12) + 4;

            // Tropical Palm
            const treeL = this._createJunglePalm();
            treeL.position.set(-6.5 - Math.random() * 4, 0, z);
            chunk.add(treeL);

            const treeR = this._createJunglePalm();
            treeR.position.set(6.5 + Math.random() * 4, 0, z + 5);
            chunk.add(treeR);

            // Ancient Totem Pillar / Rock
            if (Math.random() > 0.4) {
                const rock = this._createJungleRock();
                rock.position.set(-8.5 - Math.random() * 6, 0, z + 2);
                chunk.add(rock);
            }
        }
    }

    _createJunglePalm() {
        const tree = new THREE.Group();
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.6 });

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 5.0, 7), trunkMat);
        trunk.position.y = 2.5;
        trunk.rotation.z = (Math.random() - 0.5) * 0.15;
        tree.add(trunk);

        // Canopy
        for (let i = 0; i < 5; i++) {
            const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 4), leafMat);
            leaf.position.y = 5.2;
            leaf.rotation.z = 0.5 + i * 0.1;
            leaf.rotation.y = (i / 5) * Math.PI * 2;
            tree.add(leaf);
        }
        return tree;
    }

    _createJungleRock() {
        const rockGeom = new THREE.DodecahedronGeometry(1.5 + Math.random() * 1.5, 1);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x3b4436, roughness: 0.9 });
        const rock = new THREE.Mesh(rockGeom, rockMat);
        rock.position.y = 1.0;
        return rock;
    }

    // 2. Candy Land Props (Waffle mountains, lollipops, candy canes)
    _populateCandyProps(chunk) {
        for (let i = 0; i < 3; i++) {
            const z = -this.chunkLength / 2 + (i * 12) + 3;

            // Swirl Lollipop
            const lolL = this._createLollipop();
            lolL.position.set(-6.8 - Math.random() * 4, 0, z);
            chunk.add(lolL);

            // Candy Cane
            const lolR = this._createCandyCane();
            lolR.position.set(6.8 + Math.random() * 4, 0, z + 6);
            chunk.add(lolR);

            // Waffle Mountain
            if (Math.random() > 0.4) {
                const cone = this._createWaffleMountain();
                cone.position.set(12 + Math.random() * 8, 0, z + 3);
                chunk.add(cone);
            }
        }
    }

    _createLollipop() {
        const lol = new THREE.Group();
        const stick = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 4.5, 8),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        stick.position.y = 2.25;
        lol.add(stick);

        const head = new THREE.Mesh(
            new THREE.CylinderGeometry(1.1, 1.1, 0.35, 16),
            new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? 0xff477e : 0x06d6a0, roughness: 0.2 })
        );
        head.rotation.x = Math.PI / 2;
        head.position.y = 4.5;
        lol.add(head);
        return lol;
    }

    _createCandyCane() {
        const cane = new THREE.Group();
        const stick = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.14, 4.0, 8),
            new THREE.MeshStandardMaterial({ color: 0xff0054 })
        );
        stick.position.y = 2.0;
        cane.add(stick);
        return cane;
    }

    _createWaffleMountain() {
        const mtn = new THREE.Mesh(
            new THREE.ConeGeometry(5, 14, 7),
            new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8 })
        );
        mtn.position.y = 7;
        return mtn;
    }

    // 3. Road Land Props (Realistic skyscrapers, billboards, green trees, streetlights)
    _populateRoadProps(chunk) {
        for (let i = 0; i < 3; i++) {
            const z = -this.chunkLength / 2 + (i * 12) + 4;

            // City Building
            const bL = this._createCityBuilding();
            bL.position.set(-10 - Math.random() * 12, 0, z);
            chunk.add(bL);

            const bR = this._createCityBuilding();
            bR.position.set(10 + Math.random() * 12, 0, z + 5);
            chunk.add(bR);

            // Roadside Pine Tree
            const tree = this._createRoadTree();
            tree.position.set(-6.5, 0, z + 2);
            chunk.add(tree);

            // Streetlight
            const light = this._createStreetlight();
            light.position.set(5.5, 0, z + 6);
            light.rotation.y = Math.PI;
            chunk.add(light);
        }
    }

    _createCityBuilding() {
        const height = 18 + Math.random() * 40;
        const b = new THREE.Mesh(
            new THREE.BoxGeometry(7, height, 7),
            new THREE.MeshStandardMaterial({ color: 0x2b3a4a, roughness: 0.3, metalness: 0.7 })
        );
        b.position.y = height / 2;
        return b;
    }

    _createRoadTree() {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.25, 2.5, 6),
            new THREE.MeshStandardMaterial({ color: 0x4a3525 })
        );
        trunk.position.y = 1.25;
        tree.add(trunk);

        const foliage = new THREE.Mesh(
            new THREE.ConeGeometry(1.3, 3.5, 6),
            new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.7 })
        );
        foliage.position.y = 3.5;
        tree.add(foliage);
        return tree;
    }

    _createStreetlight() {
        const light = new THREE.Group();
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6),
            new THREE.MeshStandardMaterial({ color: 0x7f8c8d })
        );
        pole.position.y = 2.25;
        light.add(pole);

        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.08, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x7f8c8d })
        );
        arm.position.set(-0.5, 4.4, 0);
        light.add(arm);

        const bulb = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.08, 0.15),
            new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe699, emissiveIntensity: 1.2 })
        );
        bulb.position.set(-0.9, 4.3, 0);
        light.add(bulb);
        return light;
    }

    // 4. Horror World Props (Gothic dead trees, mausoleums, gravestones)
    _populateHorrorProps(chunk) {
        for (let i = 0; i < 3; i++) {
            const z = -this.chunkLength / 2 + (i * 12) + 3;

            const treeL = this._createHorrorTree();
            treeL.position.set(-6.8 - Math.random() * 4, 0, z);
            chunk.add(treeL);

            const treeR = this._createHorrorTree();
            treeR.position.set(6.8 + Math.random() * 4, 0, z + 5);
            chunk.add(treeR);

            // Gravestone
            if (Math.random() > 0.3) {
                const grave = this._createTombstone();
                grave.position.set(-8.5 - Math.random() * 5, 0, z + 2);
                chunk.add(grave);
            }
        }
    }

    _createHorrorTree() {
        const tree = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x1b1322, roughness: 0.95 });
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.45, 5.0, 5), mat);
        trunk.position.y = 2.5;
        trunk.rotation.z = (Math.random() - 0.5) * 0.25;
        tree.add(trunk);

        // Twisted branch
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 2.5, 4), mat);
        branch.position.set(0.6, 4.2, 0);
        branch.rotation.z = 0.8;
        tree.add(branch);

        const branch2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 2.0, 4), mat);
        branch2.position.set(-0.6, 3.8, 0);
        branch2.rotation.z = -0.7;
        tree.add(branch2);
        return tree;
    }

    _createTombstone() {
        const tomb = new THREE.Group();
        const stone = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 1.1, 0.25),
            new THREE.MeshStandardMaterial({ color: 0x2e253b, roughness: 0.9 })
        );
        stone.position.y = 0.55;
        stone.rotation.y = (Math.random() - 0.5) * 0.4;
        tomb.add(stone);
        return tomb;
    }

    _createWorldArch() {
        const arch = new THREE.Group();
        const w = this.currentWorld;
        let matColor = 0x2d3748;
        if (w === 'jungle') matColor = 0x4a3f2c;
        if (w === 'candy') matColor = 0xffffff;
        if (w === 'horror') matColor = 0x181224;

        const mat = new THREE.MeshStandardMaterial({ color: matColor, roughness: 0.7 });

        const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6.5, 0.6), mat);
        pillarL.position.set(-5.3, 3.25, 0);
        arch.add(pillarL);

        const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6.5, 0.6), mat);
        pillarR.position.set(5.3, 3.25, 0);
        arch.add(pillarR);

        const beam = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.7, 0.8), mat);
        beam.position.set(0, 6.3, 0);
        arch.add(beam);

        return arch;
    }

    update(playerZ) {
        this.dirLight.position.z = playerZ + 20;
        this.dirLight.target.position.z = playerZ - 20;
        this.dirLight.target.updateMatrixWorld();

        const recycleDistance = 35;
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i];
            if (chunk.position.z > playerZ + recycleDistance) {
                this.furthestZ -= this.chunkLength;
                chunk.position.z = this.furthestZ;
            }
        }
    }

    _disposeGroup(group) {
        group.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            }
        });
    }

    reset() {
        for (let i = 0; i < this.chunkCount; i++) {
            const z = 20 - (i * this.chunkLength);
            this.chunks[i].position.z = z;
            this.furthestZ = z;
        }
    }
}
