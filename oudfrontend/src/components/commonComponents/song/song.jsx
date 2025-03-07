import React, { Component } from "react";
import "./song.css";
import { BrowserRouter as Router, Redirect } from "react-router-dom";
import axios from "axios";
import PropTypes from "prop-types";
import play from "../../../assets/images/play.png";
import musicIcon from "../../../assets/images/musicIcon.png";
import { addToLikedSongs, removeLikedSong } from "../../../utils/index";
import {base} from "../../../config/environment"
import {config} from "../../../utils/auth"


/**
 * @classdesc this is a component that renders playlist page
 * @author Ahmed Walid <ahmedwa1999@gmail.com>
 * @class
 * @param {string} key the Id of the playlist
 * @param {string} clickedId the Id of the clicked song
 * @param {func} handleClick  called when the user click on the song
 * @param {func} handlePlay called when the user click on the play button
 *
 * @property {object} state carries the state of the component
 * @param {object} track song object
 * @property {boolean} state.hover true if the mouse is on the song false otherwise
 * @property {string} state.albumName name of the album
 * @property {object} state.playlist carries all the information of the playlist
 * @property {Array.<track>} state.tracks array of all the songs in the playlist
 * @property {boolean} state.playing true when the song is playing. Otherwise, it is false
 * @property {boolean} state.queued true when the song is added to queue. Otherwise, it is false
 * @property {boolean} state.cliked true when the song is focused
 * @property {boolean} state.displayDropdown true when the song optopns are visible
 * @property {boolean} state.saved true when the song is saved to likedSongs
 *
 * @returns {
 *              <div>
 *               <div classname="playlistHeader">
 *                  <div classname="imageContainer">
 *                      <img/>
 *                  </div>
 *
 *                  <div classname="playlistHeaderBody">
 *                      <HeaderBodyTop/>
 *                      <HeaderBodyBottom/>
 *                  </div>
 *                  <SongList/>
 *               </div>
 *              </div>
 *
 *          }
 */
class Song extends Component {
  /**
   *
   * @constructor
   */
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      track: this.props.track,
      albumName: "",
      playing: false,
      displayDropdown: false,
      saved: false,
      queued: false,
      clicked: false,
      redirect: null,
    };
  }
  /**
   * sets state.hover to true and called onMouseEnter
   * @returns {void}
   */
  hover = () => this.setState({ hover: true });
  /**
   * sets state.hover to false and called onMouseLeave
   * @returns {void}
   */
  notHover = () => this.setState({ hover: false });
  /**
   *gets the name of the album of the song
   * @returns {void}
   */
  componentDidMount() {
    axios
      .get(`${base}/albums/${this.props.track.albumId}/`, config)
      .then((response) => {
        const album = response.data;
        this.setState({ albumName: album.name });
      })
      .catch((error) => {
        console.log(error);
      });

    axios
      .get(
        `${base}/me/tracks/contains/${this.props.track.albumId}/`, config
      )
      .then((response) => {
        const isFound = response.data;
        this.setState({ saved: isFound });
      })
      .catch((error) => {
        console.log(error);
      });
  }
  /**
   *if the recieved props is changed it sets state.clicked to true or
   *false and calls hh()
   * @param {object} nextProps
   */
  componentWillReceiveProps(nextProps) {
    if (nextProps.clickedId !== this.props.clickedId) {
      this.setState({
        clicked: nextProps.clickedId === this.props.track.id ? true : false,
      });
      this.hh();
    }
    if (nextProps.playingItemId !== this.props.playingItemId) {
      this.setState({
        playing: nextProps.playingItemId === this.props.track.id ? true : false,
      });
    }
  }
  /**
   * called when the play button of the song is clicked and it calls the passed function from parent
   * @param {void}
   */
  playSongClicked() {
    this.props.handlePlay(this.state.track.id);
    this.setState({ playing: !this.state.playing });
  }
  /**
   * saves the song to liked songs
   * @param {void}
   */
  handleSaving() {
    this.toggleDropdown();
    if (this.state.saved === false) {
      addToLikedSongs(this.state.track.id);
      this.setState({ saved: true });
    } else {
      removeLikedSong(this.state.track.id);
      this.setState({ saved: false });
    }
  }
  /**
   * Adds the song to the queue
   * @param {void}
   */
  handleQueue() {
    this.toggleDropdown();
    if (this.state.queued === false) {
      axios
        .post(`${base}/me/queue/`, this.state.track, config)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
      this.setState({ queued: true });
    } else {
      axios
        .delete(`${base}/me/queue/${this.state.track.id}`, config)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
      this.setState({ queued: false });
    }
  }
  redirect(route) {
    this.setState({ redirect: route });
  }
  /**
   * called when state.clicked changes
   * it sets state.displayDropdown to false if clicked is true
   * @param {void}
   */
  hh() {
    if (this.state.clicked === true) {
      this.setState({ displayDropdown: false });
    }
  }
  /**
   * called when the options button is clicked to toggle state.displayDropdown
   * @param {void}
   */
  toggleDropdown() {
    this.setState({ displayDropdown: !this.state.displayDropdown });
  }
  addToPlaylist() {
    this.toggleDropdown();
  }
  render() {
    if (this.state.redirect) {
      return <Redirect to={this.state.redirect} />;
    }
    return (
      <Router>
        <button
          onClick={() => {
            this.props.handleClick(this.state.track.id);
          }}
          data-testid="song"
          className={this.state.playing ? "song row hovered" : "song row"}
          id="song"
          onMouseEnter={this.hover}
          onMouseLeave={this.notHover}
        >
          <div className="songIcon col-1">
            <button
              data-testid="playButton"
              className="songButton goldText"
              onClick={this.playSongClicked.bind(this)}
            >
              <img
                data-testid="playButtonImage"
                src={
                  this.state.hover || this.state.clicked || this.state.playing
                    ? play
                    : musicIcon
                }
                width="18"
                height="20"
                alt="play music icon"
              />
            </button>
          </div>

          <div className="songInfo col-8">
            <span
              data-testid="songName"
              className={this.state.playing ? "goldText" : "whiteText"}
            >
              {this.state.track.name}
            </span>
            <p data-testid="aristsNames">
              <span>
                {this.state.track.artists.map((artist) => {
                  return (
                    <span>
                      <button
                        data-testid="artistName"
                        onClick={() => {
                          this.redirect(`/artist/${artist.id}`);
                        }}
                        className="playlistAnchor songButton"
                      >
                        {artist.name}
                      </button>
                      <span data-testid="comma" className="gray-text">
                        {" "}
                        •{" "}
                      </span>
                    </span>
                  );
                })}
              </span>
              <button
                data-testid="albumName"
                onClick={() => {
                  this.redirect(`/albums/${this.state.track.albumId}`);
                }}
                className="playlistAnchor songButton"
              >
                {this.state.albumName}
              </button>
            </p>
          </div>

          <div className="col-1">
            <div data-testid="dropdown" className="dropdown">
              <button
                data-testid="dropdownButton"
                onClick={this.toggleDropdown.bind(this)}
                className={
                  this.state.hover || this.state.clicked
                    ? "songButton block"
                    : "songButton hide"
                }
                id="songDropdownButton"
              >
                <h3 className={this.state.playing ? "goldText" : "whiteText"}>
                  ...
                </h3>
              </button>

              <div
                data-testid="dropdownList"
                className={
                  this.state.displayDropdown && this.state.clicked
                    ? "dropdownContent block"
                    : "dropdownContent hide"
                }
                id="dropdownContent"
              >
                <button
                  data-testid="saveSong"
                  onClick={this.handleSaving.bind(this)}
                  className="SongDropdownItem songButton"
                >
                  {this.state.saved
                    ? "Remove From Your Liked Songs"
                    : "Save to your Liked Songs"}
                </button>

                <button
                  data-testid="addToQueue"
                  onClick={this.handleQueue.bind(this)}
                  className="SongDropdownItem songButton"
                >
                  {this.state.queued ? "Remove From Queue" : "Add to Queue"}
                </button>

                <button
                  data-testid="addToPlaylist"
                  className="SongDropdownItem songButton"
                  onClick={() => this.props.addToPlaylist()}
                >
                  Add to Playlist
                </button>
              </div>
            </div>
          </div>

          <div className="col-2">
            <p
              data-testid="songTime"
              className={this.state.playing ? "goldText" : "whiteText"}
            >
              {this.state.track.songTime}3:34
            </p>
          </div>
        </button>
      </Router>
    );
  }
}
Song.propTypes = {
  clickedId: PropTypes.string,
  handleClick: PropTypes.func,
  handlePlay: PropTypes.func,
  track: PropTypes.object,
};
export default Song;
