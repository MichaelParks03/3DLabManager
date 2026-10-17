import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Stage } from '@react-three/drei'
import { Suspense, useState } from 'react'

import '../css/Labs.css'

const labModels = import.meta.glob(
  "../../../../assets/3D models/Lab GLBs/*.glb",
  { eager: true, query: "?url", import: "default" }
);

const modelUrlFor = (labId) => labModels[`../../../../assets/3D models/Lab GLBs/lab_${labId}.glb`];

function Model({labModel}) {
  const { scene } = useGLTF(labModel);
  return <primitive object={scene} />;
}

function Labs() {
  const [labModel, setLabModel] = useState("208")

  const changeLabModel = (newLab) => {
    setLabModel(newLab.target.value)
  }

  return (
    <div className="labs">
      <div className="labs-dropdown-container">
        <select 
          className="labs-dropdown" 
          value={labModel} 
          onChange={changeLabModel}
        >
          <option value="202">202</option>
          <option value="203">203</option>
          <option value="208">208</option>
          <option value="335">335</option>
        </select>
        <div className='labs-underline'></div>
      </div>

      <Canvas className='labs-canvas'
              style={{width: '99dvw', height: '80dvh'}}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Model labModel={modelUrlFor(labModel)}/>
          </Stage>
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  )
}

export default Labs
