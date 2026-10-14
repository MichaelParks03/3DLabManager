import SearchBar from "../components/Search"
import "../css/Home.css"

import { MeshGradient } from "@paper-design/shaders-react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

//import {useState, useEffect};

/*
Chrome developer demo referenced extensively: https://chrome.dev/web-ai-demos/speech-api-playground/
*/

function handleClick()
{
	recognition.start();
}

function Home (){
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	if (SpeechRecognition)
	{
		const SpeechRecognitionPhrase = window.SpeechRecognitionPhrase || window.webkitSpeechRecognitionPhrase;
		const recognition = new SpeechRecognition();
		window.currentRecognition = recognition;
	}

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
    {/* TODO: make the voice only be active for the kiosk (maybe have a hidden toggle?) 
		check status of SpeechRecognition? 
		*/}
    <div className="home-voice-btn-container">
      <button className="home-voice-btn"
				onClick={handleClick}>
        <FontAwesomeIcon icon="fa-solid fa-microphone" />
      </button>
    </div>
  </div>

}

export default Home