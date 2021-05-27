// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Moneygram {
    constructor() {}

    uint256 public imageCount = 0;
    mapping(uint256 => Image) public images;

    event ImageCreated(
        uint256 id,
        string hash,
        string description,
        uint256 tipAmount,
        address author
    );

    event ImageTipped(
        uint256 id,
        string hash,
        string description,
        uint256 tipAmount,
        address author
    );

    struct Image {
        uint256 id;
        string hash;
        string description;
        uint256 tipAmount;
        address author;
    }

    function uploadImage(string memory _imgHash, string memory _description)
        public
    {
        imageCount++;
        images[imageCount] = Image(
            imageCount,
            _imgHash,
            _description,
            0,
            msg.sender
        );

        emit ImageCreated(imageCount, _imgHash, _description, 0, msg.sender);
    }

    function tipOwnerImage(uint256 _id) public payable {
        Image memory _image = images[_id];

        address _author = _image.author;

        payable(_author).transfer(msg.value);

        _image.tipAmount = _image.tipAmount + msg.value;

        images[_id] = _image;

        emit ImageTipped(
            _id,
            _image.hash,
            _image.description,
            _image.tipAmount,
            _image.author
        );
    }
}
