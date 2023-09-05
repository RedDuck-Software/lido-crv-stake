// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./StakerBase.sol";

interface ICurve {
    function add_liquidity(uint256[2] calldata amounts, uint256 min_mint_amount)
        external
        payable
        returns (uint256);

    function lp_token() external view returns (address);

    function calc_token_amount(uint256[2] calldata amounts, bool is_deposit)
        external
        view
        returns (uint256);
}

interface ILido {
    function submit(address _referral) external payable returns (uint256);

    function balanceOf(address holder) external view returns (uint256);
}

contract LidoCrvStaker is StakerBase {
    address public constant stETH = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
    address public constant crv = 0xDC24316b9AE028F1497c275EB9192a3Ea0f67022;

    uint256[50] private _gap;

    function initialize() public initializer {
       
    }

    receive() external payable {
        uint256 depositEthAmount = msg.value / 2;
        uint256 depositStEthAmount = msg.value - depositEthAmount;
        
        require(depositEthAmount > 0, "!depositEthAmount ");
        require(depositStEthAmount > 0, "!depositStEthAmounta");

        ILido(stETH).submit{value: depositStEthAmount}(
            0x0000000000000000000000000000000000000000
        );

        uint256 stEthAmount = IERC20(stETH).balanceOf(address(this));

        IERC20(stETH).approve(crv, type(uint256).max);

        uint256 depositEthAmountCopy = depositEthAmount;
        
        ICurve(crv).add_liquidity{value: depositEthAmount}(
            [depositEthAmountCopy, stEthAmount],
            0
        );
        address lp_token = ICurve(crv).lp_token();

        IERC20(lp_token).transfer(
            msg.sender,
            IERC20(lp_token).balanceOf(address(this))
        );

        uint256 remainingStEth = IERC20(stETH).balanceOf(address(this));
        uint256 remainingEth = address(this).balance;

        require(remainingStEth >= 1, "!remainingStEth");
        require(remainingEth == 0, "!remainingEth");

    }
}
