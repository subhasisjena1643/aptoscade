export const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const createResponse = (success: boolean, data?: any, message?: string, pagination?: any) => ({
  success,
  ...(data && { data }),
  ...(message && { message }),
  ...(pagination && { pagination }),
});

export const createError = (message: string, statusCode: number = 500) => {
  const error = new Error(message) as any;
  error.statusCode = statusCode;
  return error;
};

export const formatAptosAmount = (amount: string, decimals: number = 8): string => {
  const numAmount = parseInt(amount);
  return (numAmount / Math.pow(10, decimals)).toFixed(decimals);
};

export const parseAptosAmount = (amount: string, decimals: number = 8): string => {
  const numAmount = parseFloat(amount);
  return (numAmount * Math.pow(10, decimals)).toString();
};

export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const calculateRank = (scores: Array<{ score: number }>, userScore: number): number => {
  const sortedScores = scores.sort((a, b) => b.score - a.score);
  const rank = sortedScores.findIndex(s => s.score <= userScore) + 1;
  return rank === 0 ? sortedScores.length + 1 : rank;
};

export const isValidAptosAddress = (address: string): boolean => {
  // Basic Aptos address validation
  const aptosAddressRegex = /^0x[a-fA-F0-9]{1,64}$/;
  return aptosAddressRegex.test(address);
};

export const normalizeAptosAddress = (address: string): string => {
  // Remove 0x prefix if present and ensure lowercase
  const cleanAddress = address.replace(/^0x/, '').toLowerCase();
  // Pad with zeros if needed
  return '0x' + cleanAddress.padStart(64, '0');
};
