import { Request, Response } from 'express';
import { aptos } from '../config/aptos';
import { prisma } from '../config/database';
import { ApiResponse, TransactionType, TransactionStatus } from '../types';

/**
 * @swagger
 * /api/v1/aptos/account/{address}:
 *   get:
 *     summary: Get Aptos account information
 *     tags: [Aptos]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Aptos account address
 *     responses:
 *       200:
 *         description: Account information retrieved successfully
 *       404:
 *         description: Account not found
 */
export const getAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;

    const account = await aptos.getAccountInfo({
      accountAddress: address,
    });

    const response: ApiResponse = {
      success: true,
      data: account,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Get account error:', error);
    res.status(404).json({
      success: false,
      message: 'Account not found or invalid address',
    });
  }
};

/**
 * @swagger
 * /api/v1/aptos/balance/{address}:
 *   get:
 *     summary: Get Aptos account balance
 *     tags: [Aptos]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Aptos account address
 *       - in: query
 *         name: coinType
 *         schema:
 *           type: string
 *           default: "0x1::aptos_coin::AptosCoin"
 *         description: Coin type to check balance for
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 */
export const getBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    const { coinType = "0x1::aptos_coin::AptosCoin" } = req.query;

    const resources = await aptos.getAccountResources({
      accountAddress: address,
    });

    const coinStore = resources.find(
      (resource) => resource.type === `0x1::coin::CoinStore<${coinType}>`
    );

    const balance = coinStore ? (coinStore.data as any).coin.value : '0';

    const response: ApiResponse = {
      success: true,
      data: {
        address,
        coinType,
        balance,
        balanceFormatted: (parseInt(balance) / 100000000).toFixed(8), // Convert from Octas to APT
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance',
    });
  }
};

/**
 * @swagger
 * /api/v1/aptos/transaction/{hash}:
 *   get:
 *     summary: Get transaction by hash
 *     tags: [Aptos]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction hash
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       404:
 *         description: Transaction not found
 */
export const getTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hash } = req.params;

    const transaction = await aptos.getTransactionByHash({
      transactionHash: hash,
    });

    const response: ApiResponse = {
      success: true,
      data: transaction,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(404).json({
      success: false,
      message: 'Transaction not found',
    });
  }
};

/**
 * @swagger
 * /api/v1/aptos/transactions:
 *   post:
 *     summary: Submit and track a transaction
 *     tags: [Aptos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - txHash
 *               - amount
 *               - tokenType
 *               - transactionType
 *             properties:
 *               txHash:
 *                 type: string
 *               amount:
 *                 type: string
 *               tokenType:
 *                 type: string
 *               transactionType:
 *                 type: string
 *                 enum: [DEPOSIT, WITHDRAWAL, REWARD, PURCHASE, TRANSFER]
 *               aptosData:
 *                 type: object
 *     responses:
 *       201:
 *         description: Transaction recorded successfully
 */
export const submitTransaction = async (req: any, res: Response): Promise<void> => {
  try {
    const { txHash, amount, tokenType, transactionType, aptosData } = req.body;
    const userId = req.user.id;

    // Check if transaction already exists
    const existingTx = await prisma.transaction.findUnique({
      where: { txHash },
    });

    if (existingTx) {
      res.status(400).json({
        success: false,
        message: 'Transaction already recorded',
      });
      return;
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        txHash,
        amount,
        tokenType,
        transactionType: transactionType as TransactionType,
        status: TransactionStatus.PENDING,
        aptosData,
      },
    });

    // Verify transaction on Aptos network
    try {
      const aptosTransaction = await aptos.getTransactionByHash({
        transactionHash: txHash,
      });

      if (aptosTransaction) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.CONFIRMED,
            aptosData: aptosTransaction,
          },
        });
      }
    } catch (error) {
      console.error('Transaction verification error:', error);
      // Keep as PENDING, will be verified later
    }

    const response: ApiResponse = {
      success: true,
      data: transaction,
      message: 'Transaction submitted successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Submit transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/v1/aptos/faucet:
 *   post:
 *     summary: Request testnet tokens from faucet
 *     tags: [Aptos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *               amount:
 *                 type: integer
 *                 default: 100000000
 *     responses:
 *       200:
 *         description: Faucet request successful
 */
export const requestFaucet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { address, amount = 100000000 } = req.body; // Default 1 APT

    const faucetTxns = await aptos.fundAccount({
      accountAddress: address,
      amount,
    });

    const response: ApiResponse = {
      success: true,
      data: faucetTxns,
      message: 'Faucet request successful',
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Faucet request error:', error);
    res.status(500).json({
      success: false,
      message: 'Faucet request failed',
    });
  }
};
