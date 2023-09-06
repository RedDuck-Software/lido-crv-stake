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

contract LidoCrvBase is StakerBase {
    address public constant ST_ETH = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
    address public constant CRV = 0xDC24316b9AE028F1497c275EB9192a3Ea0f67022;

    uint256[50] private _gap;

    function initialize() public initializer {
       __Ownable_init();
    }
    
}