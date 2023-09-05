import { ethers, upgrades } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import * as hre from 'hardhat';


const func = async () => {
  const { deployer } = await hre.getNamedAccounts();
  const owner = await hre.ethers.getSigner(deployer);

  const lidoCurveFactory = await ethers.getContractFactory('LidoCrvStaker', owner);
  const lidoCurveContract = await upgrades.deployProxy(lidoCurveFactory,[]);
  await lidoCurveContract.deployed();
  console.log('Lido curve deployed to:', lidoCurveContract.address);
};

func();
