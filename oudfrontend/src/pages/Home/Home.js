import React, { Component } from "react";
import "./Home.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import Navbar from "../../components/Navbar/Navbar";
import MainContent from "../../components/MainContent/MainContent"
import { base } from "./../../config/environment"
import axios from "axios"
import WebPlayer from './../../components/WebPlayer/WebPlayer';
import LoadingSnipper from './../../components/LoadingSnipper/LoadingSnipper';
import { config, isLoggedIn } from "./../../utils/auth"

/**
 * a string to store endpoint url of getting List of Categories
 * 
 * @type {string}
 * 
 */
let fetchCategoriesUrl = `${base}/browse/categories`;
let fetchCurrentUserInfo = `${base}/me`



/**
 * Component to render all the stuff in Home page
 * 
 * @author Abdallah Hemdan
 * 
 * @component 
 *
 */

class Home extends Component {
  /**
   * @constructor

   * @public

   * @param {object} props - get props from higher components
   * @param {Array<object>} items - An array of all categories of the music to display it in home page
   * @param {number} limit - The maximum number of categories to get.
   * @param {number} offset - The index of the first categories to get.
   * @param {number} total - The total number of categories available to get.
   */
  constructor(props) {
    super(props)
    this.state = {
      /**
       * An array of all categories of the music to display it in home page
       * 
       * @type {Array<object>} 
       */
      items: [],

      /**
       * The maximum number of categories to get.
       * 
       * @type {number}
       */
      limit: 0,

      /**
       * The index of the first categories to get.
       * 
       * @type {number}
       */
      offset: 0,
      /**
       * The total number of categories available to get.
       * 
       * @type {number}
       */
      total: 0,
      /**
       * Check if the data loaded from the backend or not
       */
      isLoading: true,
      userInfo: {},
      _id: "",
      username: "",
      email: "",
      displayName: "",
      credit: 0,
      images: []
    }
  }

  /**
   * Take the data fetched from the api and store it in the local state
   * 
   * @function
   * 
   * @param {Array<object>} items - An array of all categories of the music to display it in home page
   * @param {number} limit - The index of the first categories to get.
   * @param {number} offset - The maximum number of categories to get.
   * @param {number} total - The total number of categories available to get.
   * 
   * @return {void} returns nothing, it just store data in state
   */
  handleStoringCategories = ({ items, limit, offset, total }) => {
    this.setState({ items, limit, offset, total, isLoading: false });
  }
  handleStoringUserInfo = ({ _id, username, email, displayName, credit, images }) => {
    const userInfo = { _id, username, email, displayName, credit, images };
    this.setState({ userInfo, _id, username, email, displayName, credit, images });
  }

  /**
   * Fetching data of all categories immediately after the component has been mount to the DOM tree
   */
  componentDidMount() {
    axios.get(fetchCategoriesUrl) // get all categories
      .then((result) => {
        this.handleStoringCategories(result.data);
      }).catch((err) => {
        console.log(err)
      });
    axios.get(fetchCurrentUserInfo, config)
      .then((result) => {
        this.handleStoringUserInfo(result.data);
      }).catch((err) => {
        console.log(err)
      });
  }

  /**
   * @function
   * @name render
   * @description Render all Home components
   * @returns {JSX} Component for App
   */
  render() {
    console.log("Home state", this.state);
    return (
      <div>
        <Sidebar />
        <Navbar userInfo={this.state.userInfo} isLoggedIn={isLoggedIn()} />
        {
          this.state.isLoading ?
            <LoadingSnipper /> :
            <React.Fragment>
              <MainContent items={this.state.items} />
              <WebPlayer />
            </React.Fragment>
        }
      </div >
    );
  }
}

export default Home;
