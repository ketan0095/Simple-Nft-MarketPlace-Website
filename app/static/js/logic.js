Moralis.initialize(""); // Application id from moralis.io
Moralis.serverURL = ""; //Server url from moralis.io

const nft_contract_address = "";
const web3 = new Web3(window.ethereum);

var userAddress;

async function login() {
  document.getElementById('submit').setAttribute("disabled", null);
  document.getElementById('username').setAttribute("disabled", null);
  document.getElementById('useremail').setAttribute("disabled", null);

  await Moralis.Web3.authenticate().then(function (user) {
    console.log(user)
    userAddress = user.get("ethAddress");
    user.set("name", document.getElementById('username').value);
    user.set("email", document.getElementById('useremail').value);
    user.save();
    getOpenSeaElements(user.get("ethAddress"));

    document.getElementById("upload").removeAttribute("disabled");
    document.getElementById("file").removeAttribute("disabled");
    document.getElementById("name").removeAttribute("disabled");
    document.getElementById("description").removeAttribute("disabled");
    document.getElementById("assettag").style.display = "block"
    document.getElementById("assettag").style.textAlign = "center"


    return user
  })
  console.log("login clicked!!")
  console.log("userAddress :", userAddress)
  document.getElementById('upload-div').style.display = "block";
  document.getElementById('upload-div').style.flexDirection = "column";
  document.getElementById('upload-div').style.alignItems = "center";
}

async function upload() {
  const fileInput = document.getElementById("file");
  const data = fileInput.files[0];
  const imageFile = new Moralis.File(data.name, data);
  document.getElementById('upload').setAttribute("disabled", null);
  document.getElementById('file').setAttribute("disabled", null);
  document.getElementById('name').setAttribute("disabled", null);
  document.getElementById('description').setAttribute("disabled", null);
  await imageFile.saveIPFS();
  const imageURI = imageFile.ipfs();
  const metadata = {
    "name": document.getElementById("name").value,
    "description": document.getElementById("description").value,
    "image": imageURI
  }
  const metadataFile = new Moralis.File("metadata.json", { base64: btoa(JSON.stringify(metadata)) });
  await metadataFile.saveIPFS();
  const metadataURI = metadataFile.ipfs();
  const txt = await mintToken(metadataURI).then(notify)
}

async function mintToken(_uri) {
  const encodedFunction = web3.eth.abi.encodeFunctionCall({
    name: "mintToken",
    type: "function",
    inputs: [{
      type: 'string',
      name: 'tokenURI'
    }]
  }, [_uri]);

  const transactionParameters = {
    to: nft_contract_address,
    from: ethereum.selectedAddress,
    data: encodedFunction
  };
  const txt = await ethereum.request({
    method: 'eth_sendTransaction',
    params: [transactionParameters]
  });
  return txt
}

async function notify(_txt) {
  document.getElementById("resultSpace").innerHTML =
    `<input disabled = "true" id="result" type="text" class="form-control" placeholder="Description" aria-label="URL" aria-describedby="basic-addon1" value="Your NFT was minted in transaction ${_txt}">`;
}


async function getOpenSeaElements() {
  console.log("this is address ,", userAddress)

  const OSdiv = document.getElementById('OpenSeaItems')

  console.log(`https://testnets-api.opensea.io/api/v1/assets?owner=${userAddress}&order_direction=desc&offset=0&limit=20&include_orders=false`)



  const items = await fetch(`https://testnets-api.opensea.io/api/v1/assets?owner=${userAddress}&order_direction=desc&offset=0&limit=20&include_orders=false`)
    .then((res) => res.json())
    .then((res) => {

      console.log("res is...", res)
      console.log("assets is ..", res.assets)
      return res.assets
    })
    .catch((e) => {
      console.error(e);
      console.error("Could not connect to Opensea !")
      return null
    })

  if (items.lenght == 0) { return }

  items.forEach((nft) => {
    const { name, image_url, description, permalink } = nft
    const newElement = document.createElement('div')


    newElement.innerHTML = `
      <div class="card" style="width: 18rem;height:30rem;float: left;margin-left: 1%;margin-bottom: 1%;background-color:rgba(22,22,22,0.5)">
        <img class="card-img-top"
          src="${image_url}"
          alt="Card image cap" style ="height:200px;border-radius:30px;">
        <div class="card-body" style="display: flex;
        flex-direction: column;align-items: center;">
          <h5 class="card-title" style="color:white;text-align:center;"><strong>${name}</strong></h5>
          <p class="card-text" maxLength="100" style="color:white;text-align:center;">${description}</p>
          <a href="${permalink}" target="_blank" class="btn btn-primary" ">View</a>
        </div>
      </div>
      
      `

    OSdiv.appendChild(newElement)
  })


}
