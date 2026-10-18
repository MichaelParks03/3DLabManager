import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function MicButton({onClick}){
	return(
		<div className="home-voice-btn-container">
      <button className="home-voice-btn" onClick={onClick}>
        <FontAwesomeIcon icon="fa-solid fa-microphone" />
      </button>
    </div>
	)
}