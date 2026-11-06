import * as T from './vendor/three.module.min.js';

// A version-history illustration, not a physical database or deployment topology.
export function createMemoryWorld(host, { onFailure } = {}) {
  const canvas = host.querySelector('canvas[data-memory-canvas]');
  const labels = Object.fromEntries(
    [...host.querySelectorAll('[data-memory-label]')].map(el => [el.dataset.memoryLabel, el])
  );
  let disposed = false;
  let failed = false;
  let renderer;
  let cleanup = () => {};
  const hideLabels = () => Object.values(labels).forEach(el => { el.hidden = true; });
  const fail = error => {
    if (disposed || failed) return;
    failed = true;
    host.dataset.ready = 'false';
    hideLabels();
    cleanup();
    onFailure?.(error instanceof Error ? error : new Error('Memory illustration could not be rendered.'));
  };
  const empty = { set() {}, reset() {}, dispose() { disposed = true; cleanup(); } };
  if (!canvas) {
    fail(new Error('Memory illustration canvas was not found.'));
    return empty;
  }

  try {
    renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setClearColor(0x030507, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;

    const scene = new T.Scene();
    const camera = new T.OrthographicCamera(-7, 7, 3.5, -3.5, .1, 80);
    camera.position.set(.45, 11, 14);
    camera.lookAt(-.25, .25, 0);
    const rig = new T.Group();
    scene.add(rig);
    scene.add(new T.HemisphereLight(0xffffff, 0x1b2446, 2.2));
    const keyLight = new T.DirectionalLight(0xffffff, 3.4);
    keyLight.position.set(-3, 10, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    Object.assign(keyLight.shadow.camera, { left: -9, right: 9, top: 8, bottom: -8, near: 1, far: 30 });
    keyLight.shadow.normalBias = .035;
    keyLight.shadow.bias = -.0004;
    keyLight.shadow.radius = 3;
    scene.add(keyLight);
    const rimLight = new T.DirectionalLight(0xc6d8ff, 2.1);
    rimLight.position.set(6, 4, -5);
    scene.add(rimLight);

    const material = (color, extra = {}) => new T.MeshPhysicalMaterial({
      color, roughness: .43, metalness: .08, clearcoat: .28, clearcoatRoughness: .34, ...extra
    });
    const blue = material(0x2450db, { emissive: 0x122c8d, emissiveIntensity: .09 });
    const blueEdge = material(0x365fe6, { roughness: .3 });
    const blueDeep = material(0x1638a7, { roughness: .5 });
    const bluePale = material(0xa6b9ff, { roughness: .5 });
    const orange = material(0xff6b35, { roughness: .36, metalness: .04 });
    const paper = material(0xf4f6fa, { roughness: .57, metalness: .01 });
    const ink = material(0x030507, { roughness: .68, metalness: 0 });
    const whitePath = new T.MeshBasicMaterial({ color: 0xe0e7ff });
    const orangePath = new T.MeshBasicMaterial({ color: 0xff6b35 });
    const quietPath = new T.MeshBasicMaterial({ color: 0x7e9aef });
    const anchors = {};
    const clamp = n => Math.max(0, Math.min(1, n));
    const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
    const mix = (a, b, n) => a + (b - a) * n;

    function roundShape(width, depth, radius) {
      const x = -width / 2, z = -depth / 2;
      const s = new T.Shape();
      s.moveTo(x + radius, z);
      s.lineTo(x + width - radius, z);
      s.quadraticCurveTo(x + width, z, x + width, z + radius);
      s.lineTo(x + width, z + depth - radius);
      s.quadraticCurveTo(x + width, z + depth, x + width - radius, z + depth);
      s.lineTo(x + radius, z + depth);
      s.quadraticCurveTo(x, z + depth, x, z + depth - radius);
      s.lineTo(x, z + radius);
      s.quadraticCurveTo(x, z, x + radius, z);
      return s;
    }

    function plate(parent, width, depth, height, radius, mat, x = 0, y = 0, z = 0) {
      const bevel = Math.min(.055, height / 4);
      const geo = new T.ExtrudeGeometry(roundShape(width - bevel * 2, depth - bevel * 2, radius), {
        depth: height - bevel * 2, bevelEnabled: true, bevelSegments: 3,
        steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 8
      });
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, bevel, 0);
      const mesh = new T.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }

    function anchor(name, parent, x, y, z) {
      const object = new T.Object3D();
      object.position.set(x, y, z);
      parent.add(object);
      anchors[name] = object;
      return object;
    }

    function sphere(parent, radius, mat, x, y, z) {
      const mesh = new T.Mesh(new T.SphereGeometry(radius, 20, 12), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    }

    function circle(parent, radius, tube, mat, x, y, z) {
      const mesh = new T.Mesh(new T.TorusGeometry(radius, tube, 10, 48), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    }

    function border(parent, width, depth, radius, mat, y, tube = .027) {
      const points = roundShape(width, depth, radius).getPoints(64).map(p => new T.Vector3(p.x, y, -p.y));
      points.push(points[0].clone());
      const curve = new T.CatmullRomCurve3(points, false, 'centripetal');
      const mesh = new T.Mesh(new T.TubeGeometry(curve, 100, tube, 7, false), mat);
      parent.add(mesh);
      return mesh;
    }

    function path(parent, mat, radius = .023) {
      const mesh = new T.Mesh(new T.BufferGeometry(), mat);
      const arrow = new T.Mesh(new T.ConeGeometry(radius * 3.3, radius * 9, 12), mat);
      parent.add(mesh, arrow);
      let visible = true;
      let arrowVisible = true;
      return {
        set visible(value) { visible = value; mesh.visible = value; arrow.visible = value && arrowVisible; },
        set(points, showArrow = true) {
          const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)), false, 'centripetal');
          mesh.geometry.dispose();
          mesh.geometry = new T.TubeGeometry(curve, 40, radius, 7, false);
          const end = curve.getPoint(.94), direction = curve.getTangent(.94).normalize();
          arrow.position.copy(end);
          arrow.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction);
          arrowVisible = showArrow;
          arrow.visible = visible && showArrow;
        }
      };
    }

    // The single blue tray is the service boundary. Both returned objects live beyond its right edge.
    const service = new T.Group();
    service.position.set(-1.65, -.04, 0);
    rig.add(service);
    plate(service, 8.25, 5.9, .25, .42, blueDeep);
    plate(service, 8.13, 5.78, .055, .39, blue, 0, .25, 0);
    border(service, 8.02, 5.68, .34, bluePale, .325, .018);
    // Short rail details make the thickness and boundary easy to read.
    for (let i = 0; i < 3; i++) plate(service, .8, .045, .035, .018, blueEdge, -2.75 + i * 1.05, .315, 2.68);
    anchor('service', rig, -1.65, .34, -3.43);

    const shadow = new T.Mesh(new T.PlaneGeometry(26, 16), new T.ShadowMaterial({ color: 0x030507, opacity: .15 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -.12;
    shadow.receiveShadow = true;
    rig.add(shadow);

    // Identity and its existing relationship are never replaced or removed.
    const entity = new T.Group();
    entity.position.set(-4.32, .34, -1.25);
    rig.add(entity);
    plate(entity, 1.55, 1.53, .22, .23, blueDeep);
    plate(entity, 1.45, 1.43, .12, .21, paper, 0, .19, 0);
    const head = new T.Mesh(new T.CylinderGeometry(.19, .19, .06, 32), blue);
    head.position.set(0, .365, -.22);
    entity.add(head);
    plate(entity, .66, .32, .055, .15, blue, 0, .34, .2);
    circle(entity, .59, .017, bluePale, 0, .34, 0);
    anchor('entity', entity, 0, .1, 1.08);

    const relation = new T.Group();
    relation.position.set(-4.28, .34, 1.26);
    rig.add(relation);
    plate(relation, 1.55, 1.22, .17, .22, blueDeep);
    plate(relation, 1.45, 1.12, .11, .19, paper, 0, .15, 0);
    const linkA = circle(relation, .24, .055, blue, -.17, .31, 0);
    const linkB = circle(relation, .24, .055, blue, .17, .31, 0);
    linkA.scale.set(1.14, 1, .75);
    linkB.scale.set(1.14, 1, .75);
    anchor('relationship', relation, 0, .04, .99);

    const identityPath = path(rig, whitePath, .019);
    identityPath.set([[-4.32, .44, -.48], [-4.32, .44, -.12], [-4.28, .44, .26], [-4.28, .44, .66]], false);
    sphere(rig, .067, paper, -4.31, .44, -.12);

    function record(mat = blueDeep) {
      const g = new T.Group();
      rig.add(g);
      plate(g, 2.62, 1.67, .24, .19, mat);
      plate(g, 2.48, 1.53, .075, .16, paper, 0, .22, 0);
      plate(g, 1.15, .075, .025, .025, blue, -.4, .307, -.43);
      plate(g, .78, .06, .022, .025, bluePale, -.585, .307, -.21);
      plate(g, .52, .06, .022, .025, bluePale, -.715, .307, -.04);
      const status = sphere(g, .075, orange, 1.02, .34, -.46);
      const active = border(g, 2.7, 1.75, .22, orangePath, .19, .025);
      return { group: g, active, status };
    }

    const version1 = record();
    const version2 = record(blue);
    const historyAnchor = anchor('history', version1.group, 0, .14, 1.06);
    const currentAnchor = anchor('current', rig, 0, 0, 0);
    const sourcePath = path(rig, whitePath, .026);
    const retainedPath = path(rig, quietPath, .019);
    const versionPath = path(rig, orangePath, .021);
    const sourceNode = sphere(rig, .075, paper, -2.65, .4, .28);

    // A question enters the service; the copied current record leaves its boundary.
    const retrieval = new T.Group();
    rig.add(retrieval);
    const query = new T.Group();
    query.position.set(4.62, .5, -1.96);
    retrieval.add(query);
    plate(query, 1.86, .86, .17, .35, orange);
    circle(query, .16, .035, paper, -.48, .21, -.025);
    plate(query, .2, .055, .04, .024, paper, -.3, .205, .14).rotation.y = -.8;
    plate(query, .72, .05, .027, .02, paper, .35, .205, -.1);
    plate(query, .48, .05, .027, .02, paper, .23, .205, .08);
    anchor('query', query, 0, .45, -.72);

    const result = new T.Group();
    result.position.set(4.72, .47, 1.18);
    retrieval.add(result);
    plate(result, 2.5, 1.63, .27, .22, orange);
    plate(result, 2.29, 1.42, .06, .16, paper, 0, .265, 0);
    plate(result, 1.1, .075, .025, .025, orange, -.37, .335, -.37);
    plate(result, .75, .055, .022, .02, ink, -.54, .335, -.13);
    plate(result, .48, .055, .022, .02, ink, -.675, .335, .06);
    circle(result, .135, .028, orange, .85, .335, -.27);
    anchor('result', result, 0, .14, 1.12);
    const queryPath = path(retrieval, orangePath, .026);
    const resultPath = path(retrieval, orangePath, .032);

    let progress = 0;
    let dirty = true;
    let dragX = 0, dragY = 0;
    let raf = 0;
    let renders = 0;
    let pointer = null;
    let width = 0, height = 0;
    const initialBounds = host.getBoundingClientRect();
    let inView = initialBounds.bottom > 0 && initialBounds.top < window.innerHeight && initialBounds.right > 0 && initialBounds.left < window.innerWidth;
    const projected = new T.Vector3();
    host.dataset.ready = 'false';
    host.dataset.renderCount = '0';
    hideLabels();

    function applyState() {
      const update = smooth(progress * 3);
      const history = smooth(progress * 3 - 1);
      const retrieve = smooth(progress * 3 - 2);
      const v1 = version1.group, v2 = version2.group;
      v1.position.set(mix(-.15, -.8, update), mix(.49, .41, history), mix(.08, -.65, update) - .96 * history);
      v1.rotation.y = mix(-.035, -.09, history);
      v2.position.set(mix(3.05, .62, update), mix(.49, .94, update), mix(-.1, .79, update) + .52 * history);
      v2.rotation.y = mix(-.25, .025, update);
      v2.scale.setScalar(.88 + .12 * update);
      v2.visible = update > .015;
      version1.active.visible = update < .5;
      version2.active.visible = update >= .5;
      version1.status.material = update < .5 ? orange : bluePale;
      version2.status.material = orange;
      const current = update < .5 ? v1 : v2;
      currentAnchor.position.copy(current.position).add(new T.Vector3(.02, .13, 1.08));
      historyAnchor.position.set(0, .12, 1.05);

      const destination = current.position;
      sourcePath.set([
        [-3.5, .43, 1.22], [-2.65, .43, 1.22], [-2.65, .43, .28],
        [destination.x - 1.68, .45, .28], [destination.x - 1.38, destination.y + .13, destination.z]
      ]);
      sourceNode.position.set(-2.65, .43, .28);
      retainedPath.set([
        [-3.55, .43, -1.25], [-2.68, .43, -1.25], [-2.42, .43, v1.position.z],
        [v1.position.x - 1.37, v1.position.y + .13, v1.position.z]
      ], false);
      versionPath.set([
        [v1.position.x + 1.15, v1.position.y + .13, v1.position.z + .12],
        [1.25, .47, -.74], [1.85, .53, .05],
        [v2.position.x + 1.13, v2.position.y + .13, v2.position.z - .38]
      ]);
      // Retention is explicit after an update, including in the final retrieval state.
      retainedPathVisibility(update > .05);
      retrieval.visible = retrieve > .01;
      query.scale.setScalar(.9 + .1 * retrieve);
      result.position.x = mix(5.55, 4.72, retrieve);
      result.position.y = mix(.32, .47, retrieve);
      queryPath.set([
        [3.69, .62, -1.96], [2.85, .62, -1.96], [2.04, .66, -1.28],
        [1.88, .87, .18], [v2.position.x + .85, v2.position.y + .35, v2.position.z - .58]
      ]);
      resultPath.set([
        [v2.position.x + 1.36, v2.position.y + .19, v2.position.z + .25],
        [2.36, .86, 1.59], [3.04, .72, 1.58],
        [result.position.x - 1.32, result.position.y + .17, 1.23]
      ]);
      host.dataset.phase = String(Math.round(progress * 3));
      dirty = false;
    }

    // Keep the history and transition paths in the rig so they remain spatially independent.
    function retainedPathVisibility(show) {
      retainedPath.visible = show;
      versionPath.visible = show;
    }

    function positionLabels() {
      const phase = Math.round(progress * 3);
      for (const [name, object] of Object.entries(anchors)) {
        const el = labels[name];
        if (!el) continue;
        const show = name === 'history' ? phase >= 1 : ['query', 'result'].includes(name) ? phase === 3 : true;
        el.hidden = !show;
        if (!show) continue;
        object.getWorldPosition(projected).project(camera);
        el.style.left = `${(projected.x + 1) * width / 2}px`;
        el.style.top = `${(1 - projected.y) * height / 2}px`;
      }
    }

    function resizeRenderer() {
      const bounds = host.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return false;
      if (bounds.width !== width || bounds.height !== height) {
        width = bounds.width;
        height = bounds.height;
        renderer.setSize(width, height, false);
        const aspect = width / height;
        const viewHeight = Math.max(6.65, 14.05 / aspect);
        camera.left = -viewHeight * aspect / 2;
        camera.right = viewHeight * aspect / 2;
        camera.top = viewHeight / 2;
        camera.bottom = -viewHeight / 2;
        camera.updateProjectionMatrix();
      }
      return true;
    }

    function render() {
      raf = 0;
      if (disposed || failed || !inView || document.hidden) return;
      try {
        if (!resizeRenderer()) return;
        if (dirty) applyState();
        rig.rotation.set(dragY, -.055 + dragX, 0);
        rig.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        renderer.render(scene, camera);
        positionLabels();
        host.dataset.renderCount = String(++renders);
        host.dataset.ready = 'true';
      } catch (error) {
        fail(error);
      }
    }

    function request() {
      if (!disposed && !failed && inView && !document.hidden && !raf) raf = requestAnimationFrame(render);
    }

    function set(value) {
      const next = Number.isFinite(Number(value)) ? clamp(Number(value)) : 0;
      if (next !== progress) { progress = next; dirty = true; }
      request();
    }

    function down(event) {
      if (event.button !== 0 || pointer) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: dragX, dy: dragY };
      canvas.setPointerCapture(event.pointerId);
    }
    function move(event) {
      if (!pointer || pointer.id !== event.pointerId) return;
      dragX = Math.max(-.23, Math.min(.23, pointer.dx + (event.clientX - pointer.x) * .0028));
      dragY = Math.max(-.1, Math.min(.12, pointer.dy + (event.clientY - pointer.y) * .002));
      request();
    }
    function end(event) {
      if (!pointer || (event?.pointerId !== undefined && pointer.id !== event.pointerId)) return;
      if (canvas.hasPointerCapture(pointer.id)) canvas.releasePointerCapture(pointer.id);
      pointer = null;
    }
    function key(event) {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') { dragX = dragY = 0; }
      else {
        dragX = Math.max(-.23, Math.min(.23, dragX + (event.key === 'ArrowLeft' ? -.06 : event.key === 'ArrowRight' ? .06 : 0)));
        dragY = Math.max(-.1, Math.min(.12, dragY + (event.key === 'ArrowUp' ? -.035 : event.key === 'ArrowDown' ? .035 : 0)));
      }
      request();
    }
    function contextLost(event) {
      event.preventDefault();
      fail(new Error('Memory illustration WebGL context was lost.'));
    }
    function visibilityChanged() {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; end(); }
      else request();
    }
    const resize = new ResizeObserver(request);
    resize.observe(host);
    const intersection = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) request();
      else { if (raf) cancelAnimationFrame(raf); raf = 0; end(); }
    }, { threshold: 0 });
    intersection.observe(host);
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('lostpointercapture', end);
    canvas.addEventListener('keydown', key);
    canvas.addEventListener('webglcontextlost', contextLost);
    document.addEventListener('visibilitychange', visibilityChanged);

    let cleaned = false;
    cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      end();
      resize.disconnect();
      intersection.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', end);
      canvas.removeEventListener('pointercancel', end);
      canvas.removeEventListener('lostpointercapture', end);
      canvas.removeEventListener('keydown', key);
      canvas.removeEventListener('webglcontextlost', contextLost);
      document.removeEventListener('visibilitychange', visibilityChanged);
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(mat => materials.add(mat));
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(mat => mat.dispose());
      keyLight.shadow.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
    };

    request();
    return {
      set,
      reset() { dragX = dragY = 0; request(); },
      dispose() {
        if (disposed) return;
        disposed = true;
        host.dataset.ready = 'false';
        hideLabels();
        cleanup();
      }
    };
  } catch (error) {
    fail(error);
    renderer?.dispose();
    return empty;
  }
}
