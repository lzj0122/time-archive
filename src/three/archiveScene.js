import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import gsap from 'gsap'

function hash(x, z) {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123
  return value - Math.floor(value)
}

function noise(x, z) {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz
  const ux = fx * fx * (3 - 2 * fx)
  const uz = fz * fz * (3 - 2 * fz)
  const a = hash(ix, iz)
  const b = hash(ix + 1, iz)
  const c = hash(ix, iz + 1)
  const d = hash(ix + 1, iz + 1)
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, ux), THREE.MathUtils.lerp(c, d, ux), uz)
}

function fbm(x, z) {
  let value = 0
  let amplitude = 0.5
  for (let octave = 0; octave < 5; octave++) {
    value += noise(x, z) * amplitude
    x = x * 2.03 + 7.1
    z = z * 2.01 - 3.7
    amplitude *= 0.5
  }
  return value
}

function mountainHeight(x, z, variant = 0) {
  const shift = variant * 2.7
  const peakDistance = Math.abs((x - 2.6 - shift) / 4.1) + Math.abs((z + 1.2) / 5.8)
  const main = 6.9 * Math.max(0, 1 - peakDistance) ** 1.25
  const shoulder = 4.6 * Math.exp(-((x + 5.1 - shift) ** 2 / 9 + (z - 1.8) ** 2 / 12))
  const farPeak = 4.1 * Math.exp(-((x - 9.2 - shift) ** 2 / 8 + (z - 3.4) ** 2 / 11))
  const foothills = 1.25 * Math.exp(-((x + 0.5) ** 2 / 38 + (z - 5.5) ** 2 / 18))
  const broad = fbm(x * 0.16 + variant * 4, z * 0.16) * 1.65
  const detail = fbm(x * 0.62 + 12, z * 0.62 - 8) * 0.48
  const gully = Math.pow(1 - Math.abs(noise(x * 0.82 + variant * 3, z * 0.27) * 2 - 1), 3)
  const crags = Math.pow(fbm(x * 0.9 + 31, z * 0.9 - 17), 2) * 1.4
  return main + shoulder + farPeak + foothills + broad + detail + crags - gully * 0.75 - 2.15
}

function createDetailNormal(size = 128) {
  const data = new Uint8Array(size * size * 4)
  const strength = 2.4
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (noise((x + 1) / 9, y / 9) - noise((x - 1) / 9, y / 9)) * strength
      const dy = (noise(x / 9, (y + 1) / 9) - noise(x / 9, (y - 1) / 9)) * strength
      const normal = new THREE.Vector3(-dx, -dy, 1).normalize()
      const index = (y * size + x) * 4
      data[index] = (normal.x * 0.5 + 0.5) * 255
      data[index + 1] = (normal.y * 0.5 + 0.5) * 255
      data[index + 2] = (normal.z * 0.5 + 0.5) * 255
      data[index + 3] = 255
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(18, 13)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

let detailNormal

function createMountain({ width, depth, color, variant = 0, mobile = false, distant = false }) {
  const geometry = new THREE.PlaneGeometry(width, depth, mobile ? 112 : 208, mobile ? 72 : 144)
  geometry.rotateX(-Math.PI / 2)
  const positions = geometry.attributes.position
  const colors = new Float32Array(positions.count * 3)
  const snow = new THREE.Color()
  const rock = new THREE.Color()

  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index)
    const z = positions.getZ(index)
    const y = mountainHeight(x, z, variant)
    positions.setY(index, y)
    const grain = fbm(x * 1.8 + 20, z * 1.8 - 5)
    snow.setRGB(0.72 + grain * 0.22, 0.8 + grain * 0.16, 0.85 + grain * 0.13)
    rock.setRGB(0.075 + grain * 0.08, 0.12 + grain * 0.09, 0.15 + grain * 0.1)
    colors[index * 3] = rock.r
    colors[index * 3 + 1] = rock.g
    colors[index * 3 + 2] = rock.b
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  const normals = geometry.attributes.normal
  const colorAttribute = geometry.attributes.color

  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index)
    const z = positions.getZ(index)
    const y = positions.getY(index)
    const slope = normals.getY(index)
    const grain = noise(x * 2.4, z * 2.4)
    const altitude = THREE.MathUtils.clamp((y + 1) / 7, 0, 1)
    const rockVeins = THREE.MathUtils.smoothstep(fbm(x * 1.45 + 8, z * 0.72 - 4), 0.48, 0.72)
    const exposure = (1 - altitude) * 0.58 + (1 - slope) * 0.48 + rockVeins * 0.34
    const snowLine = 1 - THREE.MathUtils.smoothstep(exposure, distant ? 0.44 : 0.5, distant ? 0.82 : 0.88)
    snow.setRGB(0.61 + altitude * 0.2, 0.71 + altitude * 0.17, 0.79 + altitude * 0.14)
    rock.setRGB(0.055 + grain * 0.09, 0.085 + grain * 0.1, 0.115 + grain * 0.115)
    colorAttribute.setXYZ(
      index,
      THREE.MathUtils.lerp(rock.r, snow.r, snowLine),
      THREE.MathUtils.lerp(rock.g, snow.g, snowLine),
      THREE.MathUtils.lerp(rock.b, snow.b, snowLine),
    )
  }
  colorAttribute.needsUpdate = true

  detailNormal ||= createDetailNormal()
  const material = new THREE.MeshStandardMaterial({
    color,
    vertexColors: true,
    roughness: distant ? 1 : 0.88,
    metalness: 0,
    normalMap: distant ? null : detailNormal,
    normalScale: new THREE.Vector2(0.72, 0.72),
    flatShading: false,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = !distant
  mesh.receiveShadow = !distant
  return mesh
}

function createGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,239,196,1)')
  gradient.addColorStop(0.16, 'rgba(246,214,146,.7)')
  gradient.addColorStop(0.45, 'rgba(216,181,106,.16)')
  gradient.addColorStop(1, 'rgba(216,181,106,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createStars(count, mobile) {
  const positions = new Float32Array(count * 3)
  let seed = 71
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  for (let index = 0; index < count; index++) {
    positions[index * 3] = (random() - 0.5) * 42
    positions[index * 3 + 1] = 4 + random() * 15
    positions[index * 3 + 2] = -12 - random() * 18
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xdce9ef, size: mobile ? 0.035 : 0.045, transparent: true, opacity: 0.62, depthWrite: false }),
  )
}

function createDust(count) {
  const positions = new Float32Array(count * 3)
  let seed = 19
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  for (let index = 0; index < count; index++) {
    positions[index * 3] = (random() - 0.5) * 22
    positions[index * 3 + 1] = random() * 8 - 1
    positions[index * 3 + 2] = (random() - 0.5) * 13
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xe8edf0, size: 0.025, transparent: true, opacity: 0.38, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
}

function createSnowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 32
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.35, 'rgba(255,255,255,.95)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 32, 32)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createSnow(count, mobile) {
  const positions = new Float32Array(count * 3)
  const speeds = new Float32Array(count)
  let seed = 113
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  for (let index = 0; index < count; index++) {
    positions[index * 3] = (random() - 0.5) * 28
    positions[index * 3 + 1] = random() * 13 - 2
    positions[index * 3 + 2] = (random() - 0.5) * 18
    speeds[index] = 0.55 + random() * 0.9
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const snow = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xf4f8fa,
      size: mobile ? 0.052 : 0.068,
      map: createSnowTexture(),
      transparent: true,
      opacity: mobile ? 0.66 : 0.78,
      alphaTest: 0.02,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  )
  snow.userData.speeds = speeds
  return snow
}

function createSky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x06111e) },
      horizonColor: { value: new THREE.Color(0x163b52) },
      sunDirection: { value: new THREE.Vector3(-0.5, 0.4, -0.7).normalize() },
      sunColor: { value: new THREE.Color(0xffd694) },
      daylight: { value: 0 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 sunDirection;
      uniform vec3 sunColor;
      uniform float daylight;
      varying vec3 vWorldPosition;
      void main() {
        vec3 direction = normalize(vWorldPosition - cameraPosition);
        float gradient = smoothstep(-0.12, 0.72, direction.y);
        vec3 color = mix(horizonColor, topColor, gradient);
        float glow = pow(max(dot(direction, normalize(sunDirection)), 0.0), 42.0);
        color += sunColor * glow * (0.12 + daylight * 0.32);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })
  return new THREE.Mesh(new THREE.SphereGeometry(55, 32, 20), material)
}

function createLamp(index, glowTexture) {
  const group = new THREE.Group()
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.018, 0.24, 7),
    new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: 0.92 }),
  )
  pole.position.y = -0.12
  const bowl = new THREE.Mesh(
    new THREE.ConeGeometry(0.065, 0.07, 10, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.72, side: THREE.DoubleSide }),
  )
  bowl.rotation.x = Math.PI
  bowl.position.y = -0.015
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.042, 0.17, 9),
    new THREE.MeshBasicMaterial({ color: 0xff9b3d, transparent: true, opacity: 0.95, toneMapped: false }),
  )
  flame.position.y = 0.09
  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(0.027, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffedb0, transparent: true, opacity: 1, toneMapped: false }),
  )
  inner.position.y = 0.055
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffdf91 }))
  core.position.y = 0.08
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xf3a74d, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending }))
  halo.position.y = 0.09
  halo.scale.set(0.85, 0.85, 0.85)
  const light = new THREE.PointLight(0xffa447, 0, 2.8, 2)
  light.position.y = 0.14
  group.add(pole, bowl, flame, inner, core, halo, light)
  group.userData = { index, core, halo, flame, inner, light, energy: 0, pulse: 0 }
  group.scale.setScalar(0.001)
  return group
}

export function createArchiveScene(container, { mode = 'home' } = {}) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const mobile = window.matchMedia('(max-width: 760px)').matches
  const useBloom = !mobile
  const renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: false, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = mode === 'home' ? 1.04 : 1.1
  renderer.setClearColor(0x071827, 1)
  renderer.shadowMap.enabled = !mobile
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.domElement.className = 'archive-webgl'
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const sky = createSky()
  scene.add(sky)
  scene.fog = new THREE.Fog(0x0a2133, mobile ? 13 : 15, mobile ? 31 : 36)
  const camera = new THREE.PerspectiveCamera(mode === 'home' ? 43 : 40, 1, 0.1, 90)
  camera.position.set(0, mode === 'home' ? 3.5 : 3.1, mode === 'home' ? 12.8 : 11.8)
  camera.lookAt(0, 0.8, 0)

  const hemisphereLight = new THREE.HemisphereLight(0xb8d8eb, 0x07111b, mobile ? 1.8 : 2.05)
  scene.add(hemisphereLight)
  const keyLight = new THREE.DirectionalLight(0xffe3b0, mobile ? 2.8 : 3.35)
  keyLight.position.set(-7, 11, 6)
  keyLight.castShadow = !mobile
  keyLight.shadow.mapSize.set(1024, 1024)
  keyLight.shadow.camera.left = -13
  keyLight.shadow.camera.right = 13
  keyLight.shadow.camera.top = 12
  keyLight.shadow.camera.bottom = -10
  keyLight.shadow.camera.near = 0.5
  keyLight.shadow.camera.far = 38
  keyLight.shadow.bias = -0.0004
  scene.add(keyLight)
  const rimLight = new THREE.DirectionalLight(0x6ea9cf, 1.7)
  rimLight.position.set(8, 5, -8)
  scene.add(rimLight)

  const stars = createStars(mobile ? 90 : 220, mobile)
  scene.add(stars)

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(mode === 'home' ? 0.5 : 0.72, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xe8e1cc, emissive: 0x6b675b, emissiveIntensity: 0.35, roughness: 1, transparent: true }),
  )
  moon.position.set(6.8, 5.7, -8)
  scene.add(moon)
  const glowTexture = createGlowTexture()
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xb9d5e4, transparent: true, opacity: 0.24, depthWrite: false, blending: THREE.AdditiveBlending }))
  moonGlow.position.copy(moon.position)
  moonGlow.scale.set(5.5, 5.5, 5.5)
  scene.add(moonGlow)

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(mode === 'home' ? 0.62 : 0.82, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffe3a6, transparent: true, opacity: 0, fog: false, toneMapped: false }),
  )
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xffc46b, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))
  sunGlow.scale.set(7, 7, 7)
  scene.add(sun, sunGlow)

  const distantBack = createMountain({ width: 34, depth: 18, color: 0x29495f, variant: 3, mobile, distant: true })
  distantBack.position.set(-4, -1.8, -15)
  scene.add(distantBack)
  const distantFront = createMountain({ width: 28, depth: 15, color: 0x1c3a50, variant: 1, mobile, distant: true })
  distantFront.position.set(5, -1.2, -10)
  scene.add(distantFront)

  const mountain = createMountain({ width: 22, depth: 15, color: 0xffffff, mobile })
  scene.add(mountain)

  let secondMountain = null
  if (mode === 'summit') {
    secondMountain = createMountain({ width: 18, depth: 12, color: 0xe5eff4, variant: 2, mobile })
    secondMountain.position.set(-2.4, -6.4, -5.8)
    secondMountain.scale.set(1.18, 1.5, 1.18)
    scene.add(secondMountain)
  }

  const ridgePoints = []
  const lamps = Array.from({ length: 6 }, (_, index) => {
    const x = -7.4 + index * 2.95
    const z = 2.4 + Math.sin(index * 1.15) * 0.72
    const y = mountainHeight(x, z) + 0.16
    ridgePoints.push(new THREE.Vector3(x, y, z))
    const lamp = createLamp(index, glowTexture)
    lamp.position.set(x, y + 0.08, z)
    scene.add(lamp)
    return lamp
  })
  const ridgeCurve = new THREE.CatmullRomCurve3(ridgePoints)
  const ridge = new THREE.Mesh(
    new THREE.TubeGeometry(ridgeCurve, 120, 0.018, 6, false),
    new THREE.MeshBasicMaterial({ color: 0xe7bf72, transparent: true, opacity: 0.82 }),
  )
  scene.add(ridge)
  const ridgeGlow = new THREE.Mesh(
    new THREE.TubeGeometry(ridgeCurve, 120, 0.065, 6, false),
    new THREE.MeshBasicMaterial({ color: 0xd8a74e, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  scene.add(ridgeGlow)

  const dust = createDust(mobile ? 55 : 150)
  scene.add(dust)
  const snow = createSnow(mobile ? 420 : 900, mobile)
  scene.add(snow)

  let composer = null
  let bloom = null
  if (useBloom) {
    composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), mode === 'home' ? 0.38 : 0.44, 0.72, 0.9)
    composer.addPass(bloom)
    composer.addPass(new OutputPass())
  }

  const pointer = new THREE.Vector2()
  const parallax = new THREE.Vector2()
  let visible = true
  let intersecting = true
  let disposed = false
  let summitTimeline = null
  let elapsed = 0
  let previousTime = performance.now()
  let frameId = null
  let scrollProgress = 0
  let timelineProgress = 0
  let timelineEngaged = false
  let journey = mode === 'home' ? 0 : 0.16
  let previousJourney = journey
  let scrollVelocity = 0
  const nightTop = new THREE.Color(0x06111e)
  const dayTop = new THREE.Color(0x4f89ac)
  const nightHorizon = new THREE.Color(0x163b52)
  const dayHorizon = new THREE.Color(0xd4e2e5)
  const nightFog = new THREE.Color(0x0a2133)
  const dayFog = new THREE.Color(0x9ebbc8)
  const moonLight = new THREE.Color(0x8bb7d8)
  const sunLight = new THREE.Color(0xffdfae)
  const workingColor = new THREE.Color()

  function resize() {
    const width = Math.max(1, container.clientWidth)
    const height = Math.max(1, container.clientHeight)
    renderer.setSize(width, height, false)
    composer?.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  function onPointerMove(event) {
    if (mode !== 'home' || reducedMotion) return
    const rect = container.getBoundingClientRect()
    pointer.set(
      THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1),
      THREE.MathUtils.clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1),
    )
  }

  function onPointerLeave() { pointer.set(0, 0) }
  function onVisibilityChange() { visible = !document.hidden; syncLoop() }

  function syncLoop() {
    if (frameId !== null) {
      cancelAnimationFrame(frameId)
      frameId = null
    }
    if (!visible || !intersecting || disposed) return
    previousTime = performance.now()
    frameId = requestAnimationFrame(tick)
  }

  function updateEnvironment() {
    const orbit = journey * Math.PI
    const sunHeight = 0.5 + Math.sin(orbit) * 7.5
    const moonHeight = 0.5 + Math.sin((1 - journey) * Math.PI) * 7.5
    sun.position.set(-9 + journey * 18, sunHeight, -10)
    sunGlow.position.copy(sun.position)
    moon.position.set(9 - journey * 18, moonHeight, -8)
    moonGlow.position.copy(moon.position)

    const daylight = THREE.MathUtils.smoothstep(sunHeight, 1.2, 7.2)
    const sunOpacity = THREE.MathUtils.smoothstep(sunHeight, 0.35, 1.8)
    const moonOpacity = THREE.MathUtils.smoothstep(moonHeight, 0.35, 1.8)
    sun.material.opacity = sunOpacity
    sunGlow.material.opacity = sunOpacity * 0.34
    moon.material.opacity = moonOpacity
    moonGlow.material.opacity = moonOpacity * 0.22
    stars.material.opacity = 0.64 * (1 - daylight * 0.9)

    keyLight.position.copy(sun.position)
    keyLight.color.copy(moonLight).lerp(sunLight, daylight)
    keyLight.intensity = (mobile ? 1.25 : 1.55) + daylight * (mobile ? 2.2 : 3.1)
    rimLight.intensity = 0.85 + daylight * 0.9
    hemisphereLight.intensity = (mobile ? 1.15 : 1.35) + daylight * 1.25

    sky.material.uniforms.topColor.value.copy(nightTop).lerp(dayTop, daylight)
    sky.material.uniforms.horizonColor.value.copy(nightHorizon).lerp(dayHorizon, daylight)
    sky.material.uniforms.sunDirection.value.copy(sun.position).normalize()
    sky.material.uniforms.sunColor.value.copy(sunLight)
    sky.material.uniforms.daylight.value = daylight
    scene.fog.color.copy(nightFog).lerp(dayFog, daylight)
    renderer.toneMappingExposure = (mode === 'home' ? 0.98 : 1.04) + daylight * 0.12
  }

  function updateSnow(delta) {
    if (reducedMotion) return
    const positions = snow.geometry.attributes.position
    const speeds = snow.userData.speeds
    const fallBoost = Math.min(scrollVelocity * 7, 2.8)
    for (let index = 0; index < positions.count; index++) {
      const offset = index * 3
      positions.array[offset + 1] -= delta * (speeds[index] + fallBoost)
      positions.array[offset] += delta * (0.08 + Math.sin(elapsed * 0.65 + index * 1.7) * 0.06)
      if (positions.array[offset + 1] < -2.2) {
        positions.array[offset + 1] = 10 + hash(index, Math.floor(elapsed)) * 3
        positions.array[offset] = (hash(index + 41, Math.floor(elapsed)) - 0.5) * 28
      }
    }
    positions.needsUpdate = true
  }

  function updateTorches(delta) {
    for (const lamp of lamps) {
      const { index, energy, pulse } = lamp.userData
      const threshold = index / (lamps.length - 1)
      const target = index === 0 ? 1 : THREE.MathUtils.smoothstep(journey, threshold - 0.025, threshold + 0.025)
      lamp.userData.energy += (target - energy) * (1 - Math.exp(-delta * 8))
      lamp.userData.pulse = Math.max(0, pulse - delta * 1.8)
      const strength = lamp.userData.energy
      const flicker = reducedMotion ? 1 : 1 + Math.sin(elapsed * 12.5 + index * 2.1) * 0.13 + Math.sin(elapsed * 21.7 + index) * 0.06
      lamp.scale.setScalar(Math.max(0.001, strength))
      lamp.userData.flame.scale.set(0.85 + flicker * 0.15, flicker, 0.85 + flicker * 0.15)
      lamp.userData.flame.rotation.z = reducedMotion ? 0 : Math.sin(elapsed * 7 + index) * 0.09
      lamp.userData.inner.scale.setScalar(0.85 + flicker * 0.18)
      lamp.userData.halo.scale.setScalar(0.68 + strength * 0.34 + lamp.userData.pulse * 0.45)
      lamp.userData.halo.material.opacity = strength * (0.58 + flicker * 0.12)
      lamp.userData.light.intensity = strength * (mobile ? 1.25 : 2.1) * flicker + lamp.userData.pulse * 1.4
    }
  }

  function tick(now) {
    if (disposed || !visible || !intersecting) {
      frameId = null
      return
    }
    const delta = Math.min((now - previousTime) / 1000, 0.05)
    previousTime = now
    elapsed += delta

    const targetJourney = timelineEngaged ? timelineProgress : scrollProgress
    journey = reducedMotion ? targetJourney : journey + (targetJourney - journey) * (1 - Math.exp(-delta * 7))
    scrollVelocity = THREE.MathUtils.lerp(scrollVelocity, Math.min(Math.abs(journey - previousJourney) / Math.max(delta, 0.001), 4), 0.12)
    previousJourney = journey
    updateEnvironment()
    updateSnow(delta)

    if (bloom) bloom.strength = (mode === 'home' ? 0.38 : 0.44) + Math.sin(elapsed * 0.55) * 0.035
    dust.rotation.y += reducedMotion ? 0 : 0.00035 * (delta * 60)
    dust.position.y = reducedMotion ? 0 : Math.sin(elapsed * 0.18) * 0.08

    if (mode === 'home') {
      parallax.lerp(pointer, reducedMotion ? 1 : mobile ? 0.035 : 0.04)
      camera.position.x = parallax.x * (mobile ? 0.24 : 0.42)
      camera.position.y = 3.5 - parallax.y * (mobile ? 0.14 : 0.24)
      camera.lookAt(parallax.x * 0.1, 0.8 - parallax.y * 0.05, 0)
      updateTorches(delta)
    }

    if (composer) composer.render()
    else renderer.render(scene, camera)
    frameId = requestAnimationFrame(tick)
  }

  function playSummit() {
    if (mode !== 'summit') return
    summitTimeline?.kill()
    camera.position.z = 11.8
    camera.fov = 40
    camera.updateProjectionMatrix()
    secondMountain.position.y = -6.4
    lamps.forEach((lamp) => lamp.scale.setScalar(0.001))

    if (reducedMotion) {
      camera.position.z = 7.2
      camera.fov = 58
      camera.updateProjectionMatrix()
      secondMountain.position.y = -0.2
      lamps.forEach((lamp) => lamp.scale.setScalar(1))
      return
    }

    const shot = { z: 11.8, fov: 40 }
    const lampScales = lamps.map(() => ({ value: 0.001 }))
    summitTimeline = gsap.timeline()
      .to(shot, {
        z: 7.2,
        fov: 58,
        duration: 2.4,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.position.z = shot.z
          camera.fov = shot.fov
          camera.updateProjectionMatrix()
        },
      }, 0)
      .to(secondMountain.position, { y: -0.2, duration: 2.2, ease: 'power2.inOut' }, 0.2)
      .to(lampScales, {
        value: 1,
        duration: 0.45,
        stagger: 0.12,
        ease: 'back.out(1.7)',
        onUpdate: () => lamps.forEach((lamp, index) => lamp.scale.setScalar(lampScales[index].value)),
      }, 1.15)
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting
    syncLoop()
  }, { threshold: 0.01 })
  intersectionObserver.observe(container)
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerleave', onPointerLeave)
  document.addEventListener('visibilitychange', onVisibilityChange)
  resize()
  if (mode === 'summit') playSummit()
  syncLoop()

  return {
    replay: playSummit,
    setScrollProgress(value) {
      scrollProgress = THREE.MathUtils.clamp(value, 0, 1)
    },
    setTimelineProgress(value) {
      timelineEngaged = true
      timelineProgress = THREE.MathUtils.clamp(value, 0, 1)
    },
    ignite(index) {
      const lamp = lamps[THREE.MathUtils.clamp(Math.round(index), 0, lamps.length - 1)]
      if (!lamp) return
      lamp.userData.pulse = 1
      lamp.userData.energy = Math.max(lamp.userData.energy, 0.72)
    },
    dispose() {
      disposed = true
      summitTimeline?.kill()
      syncLoop()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      const geometries = new Set()
      const materials = new Set()
      const textures = new Set()
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry)
        const objectMaterials = Array.isArray(object.material) ? object.material : [object.material]
        objectMaterials.forEach((material) => {
          if (!material) return
          materials.add(material)
          Object.values(material).forEach((value) => value?.isTexture && textures.add(value))
        })
      })
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      textures.forEach((texture) => texture.dispose())
      bloom?.dispose()
      composer?.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    },
  }
}
