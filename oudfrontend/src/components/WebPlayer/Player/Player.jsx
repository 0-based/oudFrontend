import React, { Component, Fragment } from "react";
import "./Player.css";
import { Howl } from "howler";
import PlayingBarLeft from "./PlayingBarLeft";
import PlayingBarCenter from "./PlayingBarCenter";
import PlayingBarRight from "./PlayingBarRight";
import extend from "../../../assets/images/icons/extend.png";
import PropTypes from "prop-types";
/**
 * Component for playing the audio Oud website, It contains all the player controls.
 * @author Ahmed Ashraf
 * @component
 * @example
 * return (
 *  <Player />
 * )
 */
class Player extends Component {
  /**
   * Setting things up. It initialize what will be fetched from the API
   * @returns{void}
   */
  constructor(props) {
    super(props);
    this.state = {
      sound: null,
      audioUrl: "",
      fetched: false,
      progress: 0,
      playing: false,
      current: Number(0).toFixed(2),
      trackName: "",
      trackId: "",
      artistName: "",
      duration: Number(0).toFixed(2),
      mouseDown: false,
      shuffleState: false,
      repeatState: false,
      volume: 1.0,
      muteState: false,
      thumbHeight: 0,
      thumbDisplay: "initial",
      art: "",
      muteProgress: 0,
      loved: false,
    };
  }
  /**
   * Get the sound progress percentage to update the progress bar
   * @function
   * @returns {number}. returns the progress percentage
   */
  getSoundProgress = () => {
    const progress =
      (this.state.sound.seek() / this.state.sound.duration()) * 100;
    return progress;
  };

  /**
   * Fetching data immediately after the component has been mount to the DOM tree
   * It fetches the current playback and the current queue
   * @returns {void}
   */
  componentDidMount() {
    this.fetchPlayback();
  }

  /**
   * Get Information About The User's Current Playback and fetch the current queue with updating the state with the needed
   * information about the track to display in the UI
   * @function
   * @returns {void}
   */
  fetchPlayback = () => {
    this.props
      .getRequest("http://localhost:2022/me/player")
      .then((response) => {
        const data = response["data"];
        if (!data.hasOwnProperty("status")) {
          const track = data["item"];
          this.setState({
            audioUrl: track["audioUrl"],
            progress: Math.floor(
              (data["progressMs"] / track["duartion"]) * 100
            ),
            playing: data["isPlaying"],
            current: Number(data["progressMs"] / 60000).toFixed(2),
            trackName: track["name"],
            artistName: track["artists"][0]["name"],
            duration: Number(track["duartion"] / 60000).toFixed(2),
            shuffleState: data["shuffleState"],
            repeatState: data["repeatState"] === "off" ? false : true,
            volume: data["device"]["volumePercent"],
            muteState: data["device"]["volumePercent"] === 0 ? true : false,
            fetched: true,
            trackId: track["_id"],
            art: track["artists"][0]["image"],
            loved: this.props.chekckSavedSong(track["_id"]),
          });
          this.props.changePlayingState(data["isPlaying"]);
          this.props.fetchQueue("0", track["_id"]);
        }
      });
  };

  /**
   * Setting Howler object up.
   * While setting Howler up, It updates the state of the instance to be aware of changes in the UI.
   * Change the playing state to true on playing and false on end of the track
   * Stores the full duration of the track
   * Setting an interval function to update the progress bar periodically
   * On the end of the track return the progress bar to 0
   * @function
   * @returns {void}
   */
  playTrack = () => {
    if (this.state.sound && this.state.sound.state() === "loaded")
      this.state.sound.unload();
    const sound = new Howl({
      src: [this.state.audioUrl],
      autoplay: false,
      loop: this.state.repeatState,
      volume: Number(this.state.volume / 100).toFixed(2),
      mute: this.state.muteState,
      html5: true,
      format: ["mp3"],
      onplay: () => {
        this.props.changePlayingState(true);
        this.setState({
          playing: true,
          duration: Number(this.state.sound.duration() / 60).toFixed(2),
        });
        setInterval(() => {
          if (this.state.sound && this.state.playing) {
            const progress = this.getSoundProgress();
            const current = Number(this.state.sound.seek() / 60).toFixed(2);
            this.setState({
              progress: isNaN(progress) ? this.state.progress : progress,
              current: isNaN(current) ? this.state.current : current,
            });
          }
        }, 100);
      },
      onend: () => {
        this.props.changePlayingState(false);
        this.setState({
          playing: false,
          progress: 0,
          current: Number(0).toFixed(2),
        });
        if (!this.state.repeatState) this.handleNext();
      },
    });
    this.setState({
      sound: sound,
    });
    this.state.sound.play();
    this.state.sound.seek(this.state.current * 60);
    console.log("current: " + this.state.sound.duration());
  };

  /**
   * Handling the pause action. request from the back end to pause, pause the sound in the browser, and update the playing state
   * to false to be aware of the related UI changes
   * @function
   * @returns {void}
   */
  pause = () => {
    this.props
      .putRequest(
        "http://localhost:2022/me/player/pause?deviceId=" + this.props.deviceId
      )
      .then((resp) => {
        this.state.sound.pause();
        this.setState({ playing: false });
        this.props.changePlayingState(false);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  /**
   * PUT request to the server to play/resume the currently track.
   * @function
   * @param {integer} idx zero-based index indicates the position of the track in the context array
   * @returns {object}
   */
  playResumeRequest = (idx) => {
    return this.props.putRequest(
      "http://localhost:2022/me/player/play?deviceId=" +
      this.props.deviceId +
      "&queueIndex=0",
      { offset: { position: idx } }
    );
  };
  /**
   * Handling the resume action. request from the back end to resume the currently playing track from specific position,
   * resume the sound in the browser, and update the playing state
   * to true to be aware of the related UI changes
   * @function
   * @param {integer} idx zero-based index indicates the position of the track in the context array
   * @returns {void}
   */
  resume = (idx = this.props.idx) => {
    this.playResumeRequest(idx)
      .then((resp) => {
        this.props.changePlayingState(true);
        this.setState({ playing: true });
        this.state.sound.play();
        console.log(resp);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  /**
   * Handling the play action. request from the back end to play a track from begining, play the sound in the browser, and update the playing state
   * to true to be aware of the related UI changes
   * @function
   * @param {integer} idx zero-based index indicates the position of the track in the context array
   * @returns {void}
   */
  play = (idx = this.props.idx) => {
    this.playResumeRequest(idx)
      .then((resp) => {
        this.playTrack();
        // console.log(resp);
        console.log("play function");
      })
      .catch((error) => {
        console.log(error);
      });
  };

  /**
   * Controlling function for the play, pause, and resume actions. It specifies which action will be called
   * depending on the plaing state of the currently track
   * @function
   * @param {String} id the unique identify of the track
   * @param {integer} idx zero-based index indicates the position of the track in the context array
   * @returns{void}
   */
  handlePlayPause = (id = this.state.trackId, idx = this.props.idx) => {
    if (id !== this.state.trackId) {
      //to uncomment this we need a "REAL" live server
      // this.fetchPlayback();

      this.props
        .fetchTrack(id)
        .then((response) => {
          console.log(response);
          this.setState({
            trackName: response["data"]["name"],
            artistName: response["data"]["artists"][0]["name"],
            audioUrl: response["data"]["audioUrl"],
            duration: response["data"]["duartion"] / 60000,
            current: Number(0).toFixed(2),
            progress: Number(0).toFixed(2),
            playing: true,
            trackId: response["data"]["_id"],
          });
          this.props.changePlayingState(true);
          this.play(idx);
        })
        .catch(function (error) {
          console.log(error);
        });
      return;
    }
    if (this.state.sound) {
      this.state.sound.mute(this.state.muteState);
      this.state.sound.loop(this.state.repeatState);
      if (this.state.sound.playing()) {
        this.pause();
      } else if (this.state.sound.state() === "loaded") {
        this.resume(idx);
      }
    } else this.play(idx);
  };

  /**
   * Handling the next action.
   * Request from the server to get the next track then play it
   * @function
   * @returns {void}
   */
  handleNext = () => {
    this.props
      .postRequest(
        "http://localhost:2022/me/player/next?deviceId=" + this.props.deviceId
      )
      .then((response) => {
        this.props
          .getNext()
          .then((response) => {
            console.log(response);
            this.setState({
              trackName: response["data"]["name"],
              artistName: response["data"]["artists"][0]["name"],
              audioUrl: response["data"]["audioUrl"],
              duration: response["data"]["duartion"] / 60000,
              current: Number(0).toFixed(2),
              progress: Number(0).toFixed(2),
              playing: false,
              trackId: response["data"]["_id"],
              art: response["data"]["artists"][0]["image"],
            });
            this.props.changePlayingState(false);
            this.play();
          })
          .catch(function (error) {
            console.log(error);
          });
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  /**
   * Handling the previous action.
   * Request from the server to get the previous track then play it
   * @function
   * @returns {void}
   */
  handlePrev = () => {
    this.props
      .postRequest(
        "http://localhost:2022/me/player/previous?deviceId=" +
        this.props.deviceId
      )
      .then((response) => {
        this.props
          .getPrevious()
          .then((response) => {
            this.setState({
              trackName: response["data"]["name"],
              artistName: response["data"]["artists"][0]["name"],
              audioUrl: response["data"]["audioUrl"],
              duration: response["data"]["duartion"] / 60000,
              current: Number(0).toFixed(2),
              progress: Number(0).toFixed(2),
              playing: false,
              trackId: response["data"]["_id"],
              art: response["data"]["artists"][0]["image"],
            });
            this.props.changePlayingState(false);
            this.play();
          })
          .catch(function (error) {
            console.log(error);
          });
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  /**
   * Handling the event of clicking on the progress bar using the mouse
   * It gets the mouse click position then normalize it to the width of the bar
   * then request from the server to progress to the specified position and update the state with new progress
   * @function
   * @returns {void}
   */
  onProgressClick = (e) => {
    // e.preventDefault();
    if (!this.state.mouseDown || !this.state.sound) return;
    const width = document.getElementById("progress-width").clientWidth;
    const offsetX = e.nativeEvent.offsetX;
    // const offsetWidth = e.nativeEvent.target.offsetWidth;
    const percent = offsetX / width;
    const position = percent * this.state.duration * 60;

    this.props
      .putRequest(
        "http://localhost:2022/me/player/seek?deviceId=" + this.props.deviceId
      )
      .then((response) => {
        this.state.sound.seek(position);
        this.setState({
          progress: this.getSoundProgress(),
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  /**
   * Update the mouse down flag to be aware of the mouse click on the progress or volume bar
   * @function
   * @returns {void}
   */
  setMouseDown = (cond) => {
    this.setState({
      mouseDown: cond,
    });
  };

  /**
   * Handling the shuffle action.
   * Request from the server to shuffle the current queue then update the shuffle state to render the proper button
   * @function
   * @returns {void}
   */
  handleShuffleState = () => {
    this.props
      .putRequest(
        "http://localhost:2022/me/player/shuffle?deviceId=" +
        this.props.deviceId
      )
      .then((response) => {
        this.setState({
          shuffleState: !this.state.shuffleState,
        });
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  /**
   * Handling the repeat action.
   * Request from the server to repeat the currently playing track then update the repeat state to render the proper button
   * then active the repeat state in Howler
   * @function
   * @returns {void}
   */
  handleRepeatState = () => {
    this.props
      .putRequest(
        "http://localhost:2022/me/player/repeat?deviceId=" + this.props.deviceId
      )
      .then((response) => {
        const loop = !this.state.repeatState;
        this.setState({
          repeatState: loop,
        });
        if (this.state.sound) this.state.sound.loop(loop);
        console.log("from repeat it's fine!");
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  volumeRequest = (volumePercent = this.state.volume) => {
    return this.props.putRequest(
      "http://localhost:2022/me/player/volume?deviceId=" + this.props.deviceId
    );
    //+"&volumePercent=" + volumePercent
  };
  /**
   * Handling the mute action.
   * Request from the server to mute the currently playing track then update the mute state to render the proper button
   * then active the mute state in Howler
   * @function
   * @returns {void}
   */
  handleMuteState = () => {
    const mute = !this.state.muteState;
    this.volumeRequest(0)
      .then((response) => {
        this.setState({
          muteState: mute,
          muteProgress: mute ? this.state.volume : 0,
          volume: mute ? 0 : this.state.muteProgress,
        });
        if (this.state.sound) this.state.sound.mute(mute);
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  /**
   * Handling the event of clicking on the volume bar using the mouse
   * It gets the mouse click position then normalize it to the width of the bar
   * then request from the server to progress to the specified volume and update the state with new volume
   * @function
   * @returns {void}
   */
  onVolumeClick = (e) => {
    // e.preventDefault();
    if (!this.state.mouseDown || !this.state.sound) return;
    const width = document.getElementById("volume-width").clientWidth;
    const offsetX = e.nativeEvent.offsetX;
    const percent = offsetX / width;
    const volume = parseInt(percent * 100);

    this.volumeRequest(volume)
      .then((response) => {
        this.state.sound.volume(volume / 100);
        this.setState({
          volume: volume,
          muteState: volume === 0 ? true : false,
        });
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  /**
   * Handling the closing of the thumbnail image of the artist in the most left part of the player
   * @function
   * @returns {void}
   */
  closeThumb = () => {
    this.setState({
      thumbHeight: 0,
      thumbDisplay: "initial",
    });
  };

  /**
   * Handling the opening of the thumbnail image of the artist in the most left part of the player
   * @function
   * @returns {void}
   */
  openThumb = () => {
    this.setState({
      thumbHeight: "35%",
      thumbDisplay: "none",
    });
  };
  render() {
    return (
      <Fragment>
        <div
          className="extedned-thumb"
          style={{ height: this.state.thumbHeight }}
        >
          <a href="/">
            <img
              src={this.state.art}
              alt="Cinque Terre"
              className="thumb-img"
            />
          </a>
          <button className="close-thumb" onClick={this.closeThumb}>
            <img src={extend} alt="Close Queue" />
          </button>
        </div>

        <div className="now-playing-bar-container" data-testid="web-palyer">
          <div className="now-playing-bar">
            <PlayingBarLeft
              playing={this.state.playing}
              display={this.state.thumbDisplay}
              art={this.state.art}
              handlePrev={() => this.handlePrev()}
              handlePlayPause={() => this.handlePlayPause()}
              handleNext={() => this.handleNext()}
              openThumb={this.openThumb}
              data-testid="web-player-left"
            />

            <PlayingBarCenter
              trackName={this.state.trackName}
              artistName={this.state.artistName}
              current={this.state.current}
              progress={this.state.progress}
              duration={this.state.duration}
              setMouseDown={() => this.setMouseDown(true)}
              onProgressClick={(e) => this.onProgressClick(e)}
              mouseUp={(e) => {
                this.onProgressClick(e);
                document.addEventListener(
                  "mouseup",
                  this.setState({
                    mouseDown: false,
                  })
                );
              }}
              data-testid="web-player-center"
            />

            <PlayingBarRight
              shuffleState={this.state.shuffleState}
              repeatState={this.state.repeatState}
              volumeState={this.state.muteState}
              volume={this.state.volume}
              trackId={this.state.trackId}
              queueElement={this.props.queueElement}
              loved={this.state.loved}
              handleShuffleState={this.handleShuffleState}
              handleRepeatState={this.handleRepeatState}
              handleMuteState={this.handleMuteState}
              setMouseDown={() => this.setMouseDown(true)}
              onVolumeClick={(e) => this.onVolumeClick(e)}
              mouseUp={(e) => {
                this.onVolumeClick(e);
                document.addEventListener(
                  "mouseup",
                  this.setState({
                    mouseDown: false,
                  })
                );
              }}
              addRemoveSavedSong={this.props.addRemoveSavedSong}
              chekckSavedSong={this.props.chekckSavedSong}
              data-testid="web-player-right"
            />
          </div>
        </div>
      </Fragment>
    );
  }
}

Player.propTypes = {
  /**
   * The id of the device of the user
   */
  deviceId: PropTypes.string.isRequired,
  /**
   * The index of the currently playing track
   */
  trackIdx: PropTypes.number.isRequired,
  /**
   * A reference to the Queue
   */
  queueElement: PropTypes.object.isRequired,
  /**
   * A function to handle axios GET request
   */
  getRequest: PropTypes.func.isRequired,
  /**
   * A function to handle axios PUT request
   */
  putRequest: PropTypes.func.isRequired,
  /**
   * A function to handle axios POST request
   */
  postRequest: PropTypes.func.isRequired,
  /**
   * A function to handle fetching of the currently queue from the server
   */
  fetchQueue: PropTypes.func.isRequired,
  /**
   * A function to fetch the next track from the server
   */
  getNext: PropTypes.func.isRequired,
  /**
   * A function to fetch the previous track from the server
   */

  getPrevious: PropTypes.func.isRequired,
  /**
   * A function to change the playing state of the parent component
   */
  changePlayingState: PropTypes.func.isRequired,
  /**
   * A function to fetch any track given the id as a parameter
   */
  fetchTrack: PropTypes.func.isRequired,
};

export default Player;
