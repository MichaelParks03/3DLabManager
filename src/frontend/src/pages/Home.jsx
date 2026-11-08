import SearchBar from "../components/Search"
import MicButton from "../components/MicButton";
import "../css/Home.css"

import { MeshGradient } from "@paper-design/shaders-react";

import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';


/*
react-speech-recognition and example used extensively. https://github.com/JamesBrill/react-speech-recognition
*/

function Home (){
	//Setup speech recognition library
	const {
    transcript,
		browserSupportsSpeechRecognition
  } = useSpeechRecognition();
	const startListening = () => SpeechRecognition.startListening({ continuous: false });

  return <div className="home">
    <div className="home-background" aria-hidden="true">
      <MeshGradient
        colors={["#0e4d00", "#2e7d32", "#9bbf35", "#cecece"]}
        distortion={1}
        swirl={0.8}
        speed={0.2}
        style={{ width: "100%", height: "100%" }}
      />
    </div>

    <div className="home-search">
      <SearchBar variant="home" placeholder={transcript}/>
    </div>    
		{/* Conditionally display microphone button depending on support */}
		{browserSupportsSpeechRecognition? <MicButton onClick={startListening}/> : null }
	</div>
}

export default Home