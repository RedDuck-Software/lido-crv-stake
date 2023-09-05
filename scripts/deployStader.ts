import { Wallet } from 'ethers';
import { ethers, upgrades } from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import * as hre from 'hardhat';

const func = async () => {
  const { deployer } = await hre.getNamedAccounts();
  const owner = await hre.ethers.getSigner(deployer);

  const staderFactory = await hre.ethers.getContractFactory(
    'StaderStaker',
    owner
  );
  const staderContract = await hre.upgrades.deployProxy(staderFactory,[]);
  await staderContract.deployed();
  console.log('Stader deployed to:', staderContract.address);
};

func();
