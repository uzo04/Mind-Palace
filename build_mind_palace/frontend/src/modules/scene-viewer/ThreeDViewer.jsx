import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import MindPalaceMark from '../../components/branding/MindPalaceMark';
import styles from './ThreeDViewer.module.css';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const CAMERA_BASE = new THREE.Vector3(9.4, 8.1, 10.8);
const CAMERA_LOOK = new THREE.Vector3(0, 0.8, 0);
const WORLD_RADIUS_X = 5.6;
const WORLD_RADIUS_Z = 4.4;
const WORLD_HEIGHT = 2.6;
const GRID_SIZE = 24;
const GRID_DIVISIONS = 24;
const PORTRAIT_SIZE = 192;
const DEFAULT_ZOOM = 1.08;
const MIN_ZOOM = 0.9;
const MAX_ZOOM = 1.3;

function finalizePortraitTexture(texture) {
  if (!texture) return texture;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function buildNodePoint(index, count) {
  if (count <= 1) return new THREE.Vector3(0, 0, 0);

  const t = (index + 0.5) / count;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const angle = index * goldenAngle;
  const radialBias = 0.65 + (index % 3) * 0.14;
  const band = (t - 0.5) * 2;

  return new THREE.Vector3(
    Math.cos(angle) * WORLD_RADIUS_X * radialBias,
    band * WORLD_HEIGHT + ((index % 4) - 1.5) * 0.18,
    Math.sin(angle) * WORLD_RADIUS_Z * (0.72 + (index % 2) * 0.14)
  );
}

function buildSceneData(locations) {
  const nodes = locations.map((location, index) => ({
    id: location.id ?? index,
    index,
    title: location.title || `Location ${index + 1}`,
    image: location.image || '',
    point: buildNodePoint(index, locations.length),
  }));

  const targetNeighbors = nodes.length > 14 ? 2 : 3;
  const seen = new Set();
  const edges = [];

  nodes.forEach((node, index) => {
    const nearest = nodes
      .map((other, otherIndex) => {
        if (otherIndex === index) return null;
        return {
          otherIndex,
          distance: node.point.distanceTo(other.point),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, targetNeighbors + 1);

    nearest.forEach(({ otherIndex, distance }) => {
      if (distance > 6.2 && nodes.length > 8) return;

      const a = Math.min(index, otherIndex);
      const b = Math.max(index, otherIndex);
      const key = `${a}-${b}`;

      if (seen.has(key)) return;
      seen.add(key);

      edges.push({
        key,
        from: nodes[a],
        to: nodes[b],
      });
    });
  });

  return { nodes, edges };
}

function getWorldTarget(nodes, activeIndex) {
  if (!Number.isInteger(activeIndex) || !nodes[activeIndex]) {
    return new THREE.Vector3(0, 0, 0);
  }

  const point = nodes[activeIndex].point;
  return new THREE.Vector3(-point.x * 0.42, -point.y * 0.24, -point.z * 0.42);
}

function placeCylinder(mesh, start, end) {
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();

  mesh.position.copy(midpoint);
  mesh.scale.set(1, length, 1);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
}

function createFallbackTexture(title) {
  const canvas = document.createElement('canvas');
  canvas.width = PORTRAIT_SIZE;
  canvas.height = PORTRAIT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
  ctx.save();
  ctx.beginPath();
  ctx.arc(PORTRAIT_SIZE / 2, PORTRAIT_SIZE / 2, PORTRAIT_SIZE / 2 - 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const gradient = ctx.createLinearGradient(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);
  gradient.addColorStop(0, '#f4efff');
  gradient.addColorStop(1, '#d9ceff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);

  const initials = (title || 'MP')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();

  ctx.fillStyle = '#6f57df';
  ctx.font = '700 68px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials || 'MP', PORTRAIT_SIZE / 2, PORTRAIT_SIZE / 2);
  ctx.restore();

  return finalizePortraitTexture(new THREE.CanvasTexture(canvas));
}

function loadPortraitTexture(imageUrl, title, onReady) {
  const fallback = createFallbackTexture(title);

  if (!imageUrl) {
    onReady(fallback);
    return () => {};
  }

  const image = new Image();
  image.crossOrigin = 'anonymous';

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = PORTRAIT_SIZE;
    canvas.height = PORTRAIT_SIZE;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      onReady(fallback);
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(PORTRAIT_SIZE / 2, PORTRAIT_SIZE / 2, PORTRAIT_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const scale = Math.max(PORTRAIT_SIZE / image.width, PORTRAIT_SIZE / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    const x = (PORTRAIT_SIZE - width) / 2;
    const y = (PORTRAIT_SIZE - height) / 2;
    ctx.drawImage(image, x, y, width, height);
    ctx.restore();

    onReady(finalizePortraitTexture(new THREE.CanvasTexture(canvas)));
  };

  image.onerror = () => onReady(fallback);
  image.src = imageUrl;

  return () => {
    image.onload = null;
    image.onerror = null;
  };
}

export default function ThreeDViewer({
  locations = [],
  initialIndex = 0,
  selectedIndex = null,
  onIndexChange,
  spaceTitle = 'Mind Palace',
}) {
  const mountRef = useRef(null);
  const zoomTargetRef = useRef(DEFAULT_ZOOM);
  const zoomCurrentRef = useRef(DEFAULT_ZOOM);
  const activeIndexRef = useRef(null);
  const navigateRef = useRef(null);
  const safeMax = Math.max(locations.length - 1, 0);
  const [current, setCurrent] = useState(() => clamp(initialIndex, 0, safeMax));
  const [hasLocalSelection, setHasLocalSelection] = useState(false);

  const hasExplicitSelection =
    Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < locations.length;
  const hasSelection = hasExplicitSelection || hasLocalSelection;
  const effectiveIndex = hasExplicitSelection ? selectedIndex : current;
  const activeIndex = hasSelection ? effectiveIndex : null;

  const sceneData = useMemo(() => buildSceneData(locations), [locations]);
  const activeLocation = locations[effectiveIndex] || locations[0];

  const navigate = useCallback((index) => {
    const next = clamp(index, 0, Math.max(locations.length - 1, 0));
    setCurrent(next);
    setHasLocalSelection(true);
    onIndexChange?.(next);
  }, [locations.length, onIndexChange]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    setCurrent(clamp(initialIndex, 0, Math.max(locations.length - 1, 0)));
    if (hasExplicitSelection) {
      setHasLocalSelection(false);
    }
  }, [hasExplicitSelection, initialIndex, locations.length]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!hasSelection) return;
      if (event.key === 'ArrowLeft') navigate(effectiveIndex - 1);
      if (event.key === 'ArrowRight') navigate(effectiveIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveIndex, hasSelection, navigate]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !sceneData.nodes.length) return undefined;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = styles.canvas;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.copy(CAMERA_BASE);

    const ambientLight = new THREE.AmbientLight(0xf7f2ff, 1.85);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.6);
    directionalLight.position.set(-8, 12, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 28;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.bias = -0.00008;
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0xe7ddff, 1.15);
    rimLight.position.set(8, 5, -6);
    scene.add(rimLight);

    const grid = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS, 0xd0c2ff, 0xe1d7ff);
    grid.position.y = -0.005;
    grid.renderOrder = 1;
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.282;
      material.depthWrite = false;
    });
    scene.add(grid);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ color: 0x7866d8, opacity: 0.12 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.02;
    shadowPlane.renderOrder = 0;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    const world = new THREE.Group();
    scene.add(world);

    const rodMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9d2ee,
      roughness: 0.94,
      metalness: 0,
      transparent: true,
      opacity: 0.7,
    });
    const rodGeometry = new THREE.CylinderGeometry(0.022, 0.022, 1, 12, 1, false);

    sceneData.edges.forEach((edge) => {
      const rod = new THREE.Mesh(rodGeometry, rodMaterial);
      const from = edge.from.point.clone().setY(0.66);
      const to = edge.to.point.clone().setY(0.66);
      placeCylinder(rod, from, to);
      world.add(rod);
    });

    const pinMaterial = new THREE.MeshStandardMaterial({
      color: 0x8f7af1,
      roughness: 0.62,
      metalness: 0.01,
      emissive: 0x4b338b,
      emissiveIntensity: 0.025,
    });
    const pinHighlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xa592ff,
      roughness: 0.56,
      metalness: 0.01,
      emissive: 0x6a52cc,
      emissiveIntensity: 0.045,
    });
    const sphereGeometry = new THREE.SphereGeometry(0.44, 32, 32);
    const coneGeometry = new THREE.ConeGeometry(0.23, 0.86, 32, 1, false);
    const portraitGeometry = new THREE.CircleGeometry(0.278, 48);

    const pinEntries = sceneData.nodes.map((node, index) => {
      const pin = new THREE.Group();
      const point = node.point.clone();

      pin.position.set(point.x, 0, point.z);
      pin.userData = { index };

      const sphere = new THREE.Mesh(sphereGeometry, pinMaterial);
      sphere.position.y = 1.02 + point.y * 0.02;
      sphere.castShadow = true;
      sphere.receiveShadow = false;
      sphere.userData = { index };

      const cone = new THREE.Mesh(coneGeometry, pinMaterial);
      cone.rotation.z = Math.PI;
      cone.position.y = 0.48 + point.y * 0.02;
      cone.castShadow = true;
      cone.receiveShadow = false;
      cone.userData = { index };

      const portraitMaterial = new THREE.MeshBasicMaterial({
        map: createFallbackTexture(node.title),
        transparent: false,
        depthTest: true,
        depthWrite: false,
        alphaTest: 0.14,
        side: THREE.DoubleSide,
        toneMapped: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      });
      const portraitAnchor = new THREE.Group();
      portraitAnchor.position.set(0, sphere.position.y, 0);
      const portrait = new THREE.Mesh(portraitGeometry, portraitMaterial);
      portrait.position.z = 0.01;
      portrait.renderOrder = 4;
      portrait.userData = { index };

      pin.add(cone);
      pin.add(sphere);
      portraitAnchor.add(portrait);
      pin.add(portraitAnchor);
      world.add(pin);

      return {
        pin,
        sphere,
        cone,
        portraitAnchor,
        portrait,
        portraitMaterial,
        image: node.image,
        title: node.title,
        baseY: point.y * 0.08,
      };
    });

    const cleanupTextureLoaders = pinEntries.map((entry) => loadPortraitTexture(
      entry.image,
      entry.title,
      (texture) => {
        if (entry.portraitMaterial.map && entry.portraitMaterial.map !== texture) {
          entry.portraitMaterial.map.dispose();
        }
        entry.portraitMaterial.map = texture;
        entry.portraitMaterial.needsUpdate = true;
      }
    ));

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(10, 10);
    const parallax = new THREE.Vector2(0, 0);
    const parallaxCurrent = new THREE.Vector2(0, 0);
    let zoomTarget = zoomTargetRef.current;
    let zoomCurrent = zoomCurrentRef.current;
    const cameraTarget = CAMERA_BASE.clone().multiplyScalar(zoomCurrent);
    const cameraCurrent = cameraTarget.clone();
    const cameraLook = CAMERA_LOOK.clone();
    const cameraLookTarget = CAMERA_LOOK.clone();
    const sphereWorld = new THREE.Vector3();
    const portraitOffset = new THREE.Vector3();
    const portraitWorld = new THREE.Vector3();
    const portraitLocal = new THREE.Vector3();
    const scaleTarget = new THREE.Vector3(1, 1, 1);
    let hoveredIndex = null;
    let frameId = 0;

    camera.position.copy(cameraCurrent);

    const resize = () => {
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const updatePointer = (clientX, clientY) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      parallax.x = clamp(pointer.x, -1, 1);
      parallax.y = clamp(pointer.y, -1, 1);
    };

    const setHovered = (index) => {
      if (hoveredIndex === index) return;
      hoveredIndex = index;
      mount.style.cursor = index == null ? 'default' : 'pointer';
    };

    const handlePointerMove = (event) => {
      updatePointer(event.clientX, event.clientY);
      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(
        pinEntries.flatMap((entry) => [entry.sphere, entry.cone]),
        false
      );

      setHovered(intersects[0]?.object?.userData?.index ?? null);
    };

    const handlePointerLeave = () => {
      pointer.set(10, 10);
      parallax.set(0, 0);
      setHovered(null);
    };

    const handleClick = () => {
      if (hoveredIndex == null) return;
      navigateRef.current?.(hoveredIndex);
    };

    const handleWheel = (event) => {
      event.preventDefault();
      const delta = event.deltaMode === 1 ? event.deltaY * 14 : event.deltaY;
      zoomTarget = clamp(zoomTarget + delta * 0.0007, MIN_ZOOM, MAX_ZOOM);
      zoomTargetRef.current = zoomTarget;
    };

    mount.addEventListener('pointermove', handlePointerMove);
    mount.addEventListener('pointerleave', handlePointerLeave);
    mount.addEventListener('click', handleClick);
    mount.addEventListener('wheel', handleWheel, { passive: false });

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const animate = () => {
      parallaxCurrent.lerp(parallax, 0.06);
      zoomCurrent += (zoomTarget - zoomCurrent) * 0.1;
      zoomCurrentRef.current = zoomCurrent;

      const currentActiveIndex = activeIndexRef.current;
      const selectedOffset = getWorldTarget(sceneData.nodes, currentActiveIndex);
      world.position.lerp(selectedOffset, 0.08);

      pinEntries.forEach((entry, index) => {
        const isActive = currentActiveIndex === index;
        const hoverLift = hoveredIndex === index ? 0.08 : 0;
        const selectedLift = isActive ? 0.22 : 0;

        entry.pin.position.y = entry.baseY + hoverLift + selectedLift;
        scaleTarget.set(
          isActive ? 1.12 : hoveredIndex === index ? 1.04 : 1,
          isActive ? 1.12 : hoveredIndex === index ? 1.04 : 1,
          isActive ? 1.12 : hoveredIndex === index ? 1.04 : 1
        );
        entry.pin.scale.lerp(scaleTarget, 0.12);

        const material = isActive ? pinHighlightMaterial : pinMaterial;
        entry.sphere.material = material;
        entry.cone.material = material;
      });

      cameraTarget.set(
        CAMERA_BASE.x * zoomCurrent + parallaxCurrent.x * 0.34,
        CAMERA_BASE.y * zoomCurrent + parallaxCurrent.y * 0.14,
        CAMERA_BASE.z * zoomCurrent + parallaxCurrent.x * 0.18
      );
      cameraCurrent.lerp(cameraTarget, 0.14);
      camera.position.copy(cameraCurrent);

      cameraLookTarget.set(
        CAMERA_LOOK.x + parallaxCurrent.x * 0.16,
        CAMERA_LOOK.y - parallaxCurrent.y * 0.08,
        CAMERA_LOOK.z
      );
      cameraLook.lerp(cameraLookTarget, 0.12);
      camera.lookAt(cameraLook);

      scene.updateMatrixWorld(true);

      pinEntries.forEach((entry) => {
        entry.sphere.getWorldPosition(sphereWorld);
        portraitOffset.subVectors(camera.position, sphereWorld).normalize().multiplyScalar(0.482);
        portraitWorld.copy(sphereWorld).add(portraitOffset);
        portraitLocal.copy(portraitWorld);
        entry.pin.worldToLocal(portraitLocal);
        entry.portraitAnchor.position.copy(portraitLocal);
        entry.portraitAnchor.quaternion.copy(camera.quaternion);
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      mount.removeEventListener('pointermove', handlePointerMove);
      mount.removeEventListener('pointerleave', handlePointerLeave);
      mount.removeEventListener('click', handleClick);
      mount.removeEventListener('wheel', handleWheel);
      mount.style.cursor = 'default';

      cleanupTextureLoaders.forEach((cleanup) => cleanup());
      portraitGeometry.dispose();
      sphereGeometry.dispose();
      coneGeometry.dispose();
      rodGeometry.dispose();
      pinMaterial.dispose();
      pinHighlightMaterial.dispose();
      rodMaterial.dispose();
      gridMaterials.forEach((material) => material.dispose());
      pinEntries.forEach((entry) => {
        if (entry.portraitMaterial.map) entry.portraitMaterial.map.dispose();
        entry.portraitMaterial.dispose();
      });
      shadowPlane.geometry.dispose();
      shadowPlane.material.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [sceneData]);

  if (!locations.length) {
    return (
      <div className={styles.empty}>
        <MindPalaceMark size={54} />
        <h3>{'\u041d\u044f\u043c\u0430 \u0434\u043e\u0431\u0430\u0432\u0435\u043d\u0438 \u043c\u0435\u0441\u0442\u0430'}</h3>
        <p>{'\u0414\u043e\u0431\u0430\u0432\u0438 \u043c\u0435\u0441\u0442\u0430, \u0437\u0430 \u0434\u0430 \u0441\u0435 \u043f\u043e\u044f\u0432\u0438 \u043f\u0430\u043c\u0435\u0442\u043e\u0432\u0430\u0442\u0430 \u043c\u0440\u0435\u0436\u0430.'}</p>
      </div>
    );
  }

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div>
          <h2>
            {hasSelection
              ? (activeLocation?.title || spaceTitle || '\u041c\u044f\u0441\u0442\u043e \u0431\u0435\u0437 \u0437\u0430\u0433\u043b\u0430\u0432\u0438\u0435')
              : (spaceTitle || 'Mind Palace')}
          </h2>
        </div>
      </div>

      <div className={styles.scene}>
        <div ref={mountRef} className={styles.viewport} />
      </div>

      {hasSelection && (
        <div className={styles.bottomNav}>
          <button type="button" onClick={() => navigate(effectiveIndex - 1)} disabled={effectiveIndex === 0}>
            {'\u2190'}
          </button>
          <button
            type="button"
            onClick={() => navigate(effectiveIndex + 1)}
            disabled={effectiveIndex === locations.length - 1}
          >
            {'\u2192'}
          </button>
        </div>
      )}
    </section>
  );
}
