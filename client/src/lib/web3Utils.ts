import { BrowserProvider, parseEther, formatEther } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface MetaMaskState {
  isInstalled: boolean;
  isConnected: boolean;
  account: string | null;
}

export async function checkMetaMaskInstalled(): Promise<boolean> {
  return typeof window.ethereum !== 'undefined';
}

export async function connectMetaMask(): Promise<string | null> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    return accounts[0] || null;
  } catch (error) {
    console.error('Error connecting to MetaMask:', error);
    throw error;
  }
}

export async function getCurrentAccount(): Promise<string | null> {
  if (!window.ethereum) {
    return null;
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_accounts', []);
    return accounts[0] || null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
}

export async function sendEthTransaction(to: string, amountInEth: string): Promise<string> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    const tx = await signer.sendTransaction({
      to,
      value: parseEther(amountInEth),
    });

    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  } catch (error) {
    console.error('Error sending ETH transaction:', error);
    throw error;
  }
}

export function formatEthAmount(wei: string): string {
  try {
    return formatEther(wei);
  } catch {
    return '0';
  }
}

export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
