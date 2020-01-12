import React, { Component } from 'react';
import Image from 'react-bootstrap/lib/Image';
import BidHistory from './BidHistory';
import BidTimer from './BidTimer';

const io = require('socket.io-client');
const socket = io();

class DetailList extends Component {
  constructor(props) {
    super(props);
    this.state = { bidHistory: [], timeRemain: 0 }
  }

  //Fetch bidHistory after first mount
  componentDidMount() {
    this.getBidHistory();
    var self = this;
    //handle to listen updateBid from server socket
    socket.on('updateBid', function (bidObj) {
      self.setState({ bidHistory: bidObj });

    });
    //Emits 'getTime' to server socket
    socket.emit('getTime', 'test');
    //handle to listen 'remaining time' from server socket
    socket.on('remainingTime', function (timeFromServer) {
      self.setState({ timeRemain: timeFromServer });
    });
  }

  getBidHistory = () => {
    // Get the bidhistory and store them in state
    fetch('/api/bidhistory')
      .then(res => res.json())
      .then(bidHistory => this.setState({ bidHistory }));
  }

  saveBid(bidhistory, liveStockID) {
    this.state.bidHistory[liveStockID] = bidhistory;
    // Save the  bidHistory  
    fetch('/api/bidhistory', { method: "POST", headers: new Headers({ 'content-type': 'application/json' }), dataType: 'json', body: JSON.stringify(this.state.bidHistory) })
      .then(res => res.json())
      .then(bidhistory => this.setState({ bidhistory }));

  }

  render() {
    var self = this;
    var detailsNodes = this.props.data.map(function (details) {
      //map the data to individual details
      var bidSort;
      if (Object.keys(self.state.bidHistory).length !== 0) {
        self.bidHistoryObj = self.state.bidHistory[details.id];
        bidSort = Object.keys(self.bidHistoryObj)
          .sort((a, b) => self.bidHistoryObj[b] - self.bidHistoryObj[a])
          .reduce((obj, key) => ({ ...obj, [key]: self.bidHistoryObj[key] }), {});
      }
      return (
        <Details
          breed={details.breed}
          key={details.id}
          id={details.id}
          basePrice={details.basePrice}
          bidIncrement={details.bidIncrement}
          image={details.image}
          bidHistory={bidSort}
          saveBid={self.saveBid.bind(self)}
          userName={self.props.userName}
          timeFromServer={self.state.timeRemain}
        >
        </Details>
      );
    });
    //print all the deatils in the list
    return (
      <div className="detailsList">
        {this.state.bidHistory.length !== 0 &&
          <div className="row">
            {detailsNodes}
          </div>
        }
      </div>
    );
  }
}


class Details extends Component {
  constructor(props) {
    super(props);
    this.state = { bidPrice: '', inputValue: '', showBidInput: true };

    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount(){
    // if(this.getLastBidValue() == this.props.basePrice){
      this.setState({ inputValue: this.getLastBidValue() + this.props.bidIncrement });
    // }
    console.log('mounted');
  }

  handleChange(event) {
    this.setState({ inputValue: event.target.value });
  }

  handleClick(event) {
    var bidIncrement = parseInt(this.props.bidIncrement);
    var factor = parseInt(event.target.value);
    var last_bid = this.getLastBidValue();
    var value = last_bid + (bidIncrement * factor);
    this.setState({ inputValue: value });
  }

  handleSubmit(event) {
    //this.setState({bidPrice: this.state.inputValue});  
    var bidHistoryObj = this.props.bidHistory;
    bidHistoryObj[this.props.userName] = this.state.inputValue;
    event.preventDefault();
    this.props.saveBid(bidHistoryObj, this.props.id);
    this.setState({ showBidInput: false });
  }

  reBid(event) {
    var bidIncrement = parseInt(this.props.bidIncrement);
    var multiplier = 1;
    var last_bid = this.getLastBidValue();
    var value = last_bid + (bidIncrement * multiplier);
    this.setState({ inputValue: value });

    this.setState({ showBidInput: true });
  }

  getLastBidValue() {
    if ( Object.keys(this.props.bidHistory).length > 0) {
      var key = Object.keys(this.props.bidHistory)[0];
      return parseInt(this.props.bidHistory[key]);
    } else {
      return this.props.basePrice;
    }
  }


  render() {
    const imgUrl = require(`./assets/${this.props.image}`);
    //display an individual LiveStock Detail
    return (
      <div className="col-md-6">
        <div className="bid-detail-div">
          <div className="row">
            <div className="col-md-12">
              <Image src={imgUrl} rounded responsive />
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <div>
                <div className="livestock-info">
                  <h5>{this.props.breed} - {this.props.id}</h5>
                  <h5>Precio base - ${this.props.basePrice}</h5>
                  {this.props.timeFromServer > 0 &&
                    <BidTimer timeFromServer={this.props.timeFromServer} />
                  }
                  {this.props.timeFromServer < 0 &&
                    <h5>VENDIDO</h5>
                  }
                </div>
                {this.props.userName !== '' &&
                  <div>
                    {this.state.showBidInput ? (
                      <form className="form-inline bid-form" onSubmit={this.handleSubmit}>
                        {this.props.timeFromServer > 0 &&
                          <div>
                            <div className="form-row align-items-center">
                              <div className="col-auto my-1">
                                <input id="inputBid" className="form-control" type="number" required readOnly placeholder="Your Price" min={this.props.basePrice} value={this.state.inputValue} onChange={this.handleChange} />
                              </div>
                              <div className="col-auto my-1">
                                <input type="submit" className="btn btn-primary bid-submit-btn" value="Ofertar" />
                              </div>
                            </div>
                            <label>Incremento: {this.props.bidIncrement}</label>
                            <div className="btn-group" role="group" aria-label="Basic example">
                              <button type="button" value="1" className="btn btn-primary" onClick={this.handleClick}>x1</button>
                              <button type="button" value="2" className="btn btn-primary" onClick={this.handleClick}>x2</button>
                              <button type="button" value="3" className="btn btn-primary" onClick={this.handleClick}>x3</button>
                            </div>
                          </div>
                        }
                      </form>
                    ) : (
                        <input type="button" className="btn btn-primary rebid-input" value="Re Ofertar" onClick={this.reBid.bind(this)} />
                      )
                    }

                  </div>
                }
              </div>
            </div>
          </div>
          {Object.keys(this.props.bidHistory).length > 0 &&
            <div>
              <div className="row bid-history-div">
                <h4 className="bid-history-header ">Historial</h4>
                <BidHistory bidHistory={this.props.bidHistory} ></BidHistory>
              </div>
            </div>
          }
        </div>
      </div>
    );

  }

}



export default DetailList;