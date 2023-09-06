// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./LidoCrvBase.sol";

interface IStEthGauge {
    function deposit(uint256 value, address to) external;
}

contract LidoCrvLpStaker is LidoCrvBase {

    address public constant ST_ETH_GAUGE = 0x182B723a58739a9c974cFDB385ceaDb237453c28;

    receive() external payable {
        uint256 depositEthAmount = msg.value / 2;
        uint256 depositStEthAmount = msg.value - depositEthAmount;
        
        require(depositEthAmount > 0, "!depositEthAmount ");
        require(depositStEthAmount > 0, "!depositStEthAmount");

        ILido(ST_ETH).submit{value: depositStEthAmount}(
            0x0000000000000000000000000000000000000000
        );
        uint256 stEthAmount = IERC20(ST_ETH).balanceOf(address(this));
        IERC20(ST_ETH).approve(CRV, type(uint256).max);

        uint256 depositEthAmountCopy = depositEthAmount;
        ICurve(CRV).add_liquidity{value: depositEthAmount}(
            [depositEthAmountCopy, stEthAmount],
            0
        );

        address lpToken = ICurve(CRV).lp_token();
        uint256 lpTokenBal = IERC20(lpToken).balanceOf(address(this));

        IERC20(lpToken).approve(ST_ETH_GAUGE, lpTokenBal);
        IStEthGauge(ST_ETH_GAUGE).deposit(lpTokenBal, address(this));

        uint256 stakedLpTokensBalance = IERC20(ST_ETH_GAUGE).balanceOf(address(this));
        IERC20(ST_ETH_GAUGE).transfer(msg.sender, stakedLpTokensBalance);

        uint256 remainingEth = address(this).balance;
        uint256 remainingStEth = IERC20(ST_ETH).balanceOf(address(this));
        uint256 remainingLpTokens = IERC20(lpToken).balanceOf(address(this));
        uint256 remaingStLpTokens =  IERC20(ST_ETH_GAUGE).balanceOf(address(this));
        
        require(remainingStEth <= 1, "!remainingStEth");
        require(remainingEth == 0, "!remainingEth");
        require(remaingStLpTokens == 0,"!remamingStLpTokens");
        require(remainingLpTokens == 0,"!remainingLpTokens");

    }
}
