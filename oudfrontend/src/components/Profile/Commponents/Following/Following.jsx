import React, { Component } from "react";
import FollowCard from "./../FollowCard/FollowCard";
import axios from "axios";
import { config } from "./../../../../utils/auth"


/**
 * @type {Class}
 * @returns {JSX} this returns the list of the current user following list
 */

class Following extends Component {
  constructor(props) {
    super(props);

    this.state = {
      items: [],
      signInId: "0"
    };
  }

  componentDidMount() {
    axios
      .get(
        "https://oud-zerobase.me/api/v1/users/" +
        this.props.userId +
        "/following?type=user",
        config
      )
      .then(response => {
        this.setState({
          items: response.data.items
        });
      })
      .catch(error => {
        console.log(error.response);
      });
    axios
      .get("https://oud-zerobase.me/api/v1/me", config)
      .then(response => {
        this.setState({ signInId: response.data.id });
      })
      .catch(error => {
        console.log(error.response);
      });
  }

  render() {
    let count = 0; //just for mapping
    return (
      <div data-test="Following">
        {this.state.items.map(item => (
          <FollowCard
            id={item.id}
            signInId={this.state.signInId}
            key={count++}
          />
        ))}
      </div>
    );
  }
}

export default Following;
