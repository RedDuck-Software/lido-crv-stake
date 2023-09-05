import { ethers, upgrades } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func = async () => {
  console.log('1');
  const provider = new ethers.providers.JsonRpcProvider(
    'https://eth-mainnet.g.alchemy.com/v2/xhO_I7Vil0SiQY8xLGq2-OglTXVUWXBp',
  );
  console.log('2');
  const signer = new ethers.Wallet(process.env.PK!, provider);
  console.log('3');
  const lidoCurveFactory = await ethers.getContractFactory('LidoCrvStaker');
  console.log('4');
  const lidoCurveContract = await upgrades.deployProxy(lidoCurveFactory,[]);
  console.log('5');
  await lidoCurveContract.deployed();
  console.log('6');
  console.log('Lido curve deployed to:', lidoCurveContract.address);
};

func();
