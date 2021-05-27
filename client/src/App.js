import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import MoneygramContract from "./contracts/Moneygram.json";
import getWeb3 from "./getWeb3";
import Web3 from "web3";

import "./App.css";

const { create } = require("ipfs-http-client");

const client = create("https://ipfs.infura.io:5001");

class App extends Component {
  state = {
    storageValue: 0,
    web3: null,
    accounts: null,
    contract: null,
    moneyGram: null,
    images: [],
    loading: false,
    description: "",
    buffer: null,
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const deployedMoneygram = MoneygramContract.networks[networkId];

      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address
      );
      const moneyGramInstance = new web3.eth.Contract(
        MoneygramContract.abi,
        deployedMoneygram && deployedMoneygram.address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState(
        { web3, accounts, contract: instance, moneyGram: moneyGramInstance },
        this.runExample
      );
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  runExample = async () => {
    const { moneyGram } = this.state;

    this.getImages();

    // // Stores a given value, 5 by default.
    // await contract.methods.set(5).send({ from: accounts[0] });

    // // Get the value from the contract to prove it worked.
    // const response = await contract.methods.get().call();

    // Update state with the result.
    // this.setState({ storageValue: response });
  };

  async getImages() {
    this.setState({
      images: [],
    });
    const imageCount = await this.state.moneyGram.methods.imageCount().call();

    console.log(imageCount);

    for (let i = 1; i <= imageCount; i++) {
      const image = await this.state.moneyGram.methods.images(i).call();
      if (image) {
        console.log(image);
        this.setState({
          images: [...this.state.images, image],
        });
      }
    }
  }

  captureFile(event) {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();

    reader.readAsArrayBuffer(file);

    reader.onloadend = () => {
      this.setState({
        buffer: Buffer(reader.result),
      });
      console.log("buffer", this.state.buffer);
    };
  }

  async uploadImage() {
    console.log("Submitting files to blockchain");

    this.setState({ loading: true });

    const result = await client.add(this.state.buffer);

    console.log(result);

    this.state.moneyGram.methods
      .uploadImage(result.path, this.state.description)
      .send({
        from: this.state.accounts[0],
      })
      .on("transactionHash", async (hash) => {
        this.setState({ loading: false });

        this.getImages();
      });
  }

  async tipImage(id) {
    this.state.moneyGram.methods.tipOwnerImage(id).send({
      from: this.state.accounts[0],
      value: 0.01 * 10 ** 18,
    });
  }

  convert(tip) {
    const web3 = new Web3(window.ethereum);
    console.log(tip);
    // console.log(window.web3.utils.fromWei(tip.toString()));
    // return new web3.utils.fromWei(tip.toString());
    return web3.utils.fromWei(tip.toString(), "ether");
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <div id={"form"}>
          <input
            type="file"
            accept=".jpg"
            onChange={(e) => {
              this.captureFile(e);
            }}
          />
          <input
            type="text"
            placeholder="Description"
            onChange={(e) => {
              this.setState({
                description: e.target.value,
              });
            }}
          />
          <button
            onClick={() => {
              this.uploadImage();
            }}
          >
            Upload Post
          </button>
        </div>
        <br></br>
        <div>
          {this.state.loading
            ? "Loading...."
            : this.state.images.map((image, key) => {
                return (
                  <div
                    key={key}
                    style={{
                      alignItems: "center",
                      justifyItems: "center",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    Total Tips {this.convert(image.tipAmount)}
                    <img
                      style={{
                        width: "100px",
                        height: "100px",
                      }}
                      src={`https://ipfs.infura.io/ipfs/${image.hash}`}
                    ></img>
                    Description: {image.description}
                    <button
                      onClick={() => {
                        this.tipImage(image.id);
                      }}
                    >
                      Tip Ether!
                    </button>
                    <br></br>
                    <hr></hr>
                  </div>
                );
              })}
        </div>
      </div>
    );
  }
}

export default App;
