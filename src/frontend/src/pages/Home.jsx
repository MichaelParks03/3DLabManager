import SearchBar from "../components/Search"
import MicButton from "../components/MicButton";
import "../css/Home.css"

import { MeshGradient } from "@paper-design/shaders-react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
//import {useState, useEffect};

/*
Chrome developer demo referenced extensively: https://chrome.dev/web-ai-demos/speech-api-playground/
*/

function test(){
	console.log("WWKPIOJOIUNHJIUNHIUNHOIHIUHp9");
}

function Home (){
	const {
    transcript,
    listening,
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
      <SearchBar variant="home"/>
    </div>    
		{browserSupportsSpeechRecognition? <MicButton onClick={startListening}/> : null }
  <p>{transcript}</p>
	</div>
}

export default Home