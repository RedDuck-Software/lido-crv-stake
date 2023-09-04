// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract StagerStaker {
    address constant public stader = 0xcf5EA1b38380f6aF39068375516Daf40Ed70D299;

    receive() external payable {
        bytes memory data = abi.encodeWithSignature("deposit(address)", msg.sender);

       (bool lidoSuccess, ) = stader.call{value: msg.value}(data);
        require(lidoSuccess, "Stader deposit function failed");

    }
}
