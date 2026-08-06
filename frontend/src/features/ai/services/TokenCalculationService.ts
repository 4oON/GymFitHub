/**
 * Token Calculation Service
 * 
 * 可复用的 Token 估算和费用计算服务
 * 支持多种 AI 模型的定价模型
 * 
 * @example
 * // 基本用法
 * import { tokenCalculationService } from './TokenCalculationService';
 * 
 * // 估算文本的 token 数量
 * const tokens = tokenCalculationService.estimateTokens(promptText);
 * 
 * // 计算费用
 * const cost = tokenCalculationService.calculateCost(tokens, 'kimi');
 * 
 * // 综合估算（prompt + completion）
 * const estimate = tokenCalculationService.estimateTokensAndCost(prompt, completion, 'kimi');
 */

// Token 使用统计
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// 费用信息
export interface CostEstimate {
  totalCost: number;
  currency: string;
  inputCost: number;
  outputCost: number;
}

// 完整的估算结果
export interface TokenAndCostEstimate {
  usage: TokenUsage;
  cost: CostEstimate;
  model: string;
}

// AI 模型定价配置
export interface ModelPricing {
  input: number;      // 输入价格（元/百万 tokens）
  output: number;     // 输出价格（元/百万 tokens）
  currency: string;   // 货币代码
  name: string;       // 模型名称
  provider: string;   // 提供商
}

// 内置模型定价（元/百万 tokens）
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Moonshot Kimi 系列
  'kimi': {
    input: 12,
    output: 12,
    currency: 'CNY',
    name: 'Moonshot Kimi',
    provider: 'Moonshot'
  },
  'kimi-v1': {
    input: 12,
    output: 12,
    currency: 'CNY',
    name: 'Moonshot Kimi',
    provider: 'Moonshot'
  },
  
  // OpenAI GPT 系列（美元定价，转换为人民币显示时可换算）
  'gpt-4': {
    input: 30,  // $0.03 per 1K = $30 per 1M
    output: 60, // $0.06 per 1K = $60 per 1M
    currency: 'USD',
    name: 'GPT-4',
    provider: 'OpenAI'
  },
  'gpt-4-turbo': {
    input: 10,
    output: 30,
    currency: 'USD',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI'
  },
  'gpt-3.5-turbo': {
    input: 0.5,
    output: 1.5,
    currency: 'USD',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI'
  },
  
  // 通义千问系列
  'qwen': {
    input: 2,
    output: 6,
    currency: 'CNY',
    name: '通义千问',
    provider: 'Alibaba'
  },
  'qwen-max': {
    input: 20,
    output: 60,
    currency: 'CNY',
    name: '通义千问-Max',
    provider: 'Alibaba'
  },
  'qwen-plus': {
    input: 2,
    output: 6,
    currency: 'CNY',
    name: '通义千问-Plus',
    provider: 'Alibaba'
  },
  
  // Google Gemini 系列
  'gemini': {
    input: 0,  // 免费层级
    output: 0,
    currency: 'USD',
    name: 'Gemini Pro',
    provider: 'Google'
  },
  'gemini-pro': {
    input: 0.5,
    output: 1.5,
    currency: 'USD',
    name: 'Gemini Pro',
    provider: 'Google'
  }
};

// 默认模型
const DEFAULT_MODEL = 'kimi';

class TokenCalculationService {
  /**
   * 估算文本的 token 数量
   * 
   * 算法说明：
   * - 中文字符（包括中文标点）：约 1 token/字符
   * - 英文字符和其他字符：约 0.25 token/字符（即 4 字符/1 token）
   * - 添加系统开销（JSON 格式、角色标记等）：50 tokens
   * 
   * @param text 要估算的文本
   * @returns 估算的 token 数量
   */
  estimateTokens(text: string): number {
    if (!text) return 0;
    
    let tokenCount = 0;
    for (const char of text) {
      // 中文字符（包括中文标点、全角符号）
      if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)) {
        tokenCount += 1;
      } else {
        // 英文字符和其他字符
        tokenCount += 0.25;
      }
    }
    
    // 添加系统开销（角色标记、JSON 格式等）
    return Math.ceil(tokenCount) + 50;
  }

  /**
   * 计算费用
   * 
   * @param tokens Token 使用统计
   * @param model 模型名称（默认为 kimi）
   * @returns 费用估算
   */
  calculateCost(tokens: TokenUsage, model: string = DEFAULT_MODEL): CostEstimate {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING[DEFAULT_MODEL];
    
    const inputCost = (tokens.prompt_tokens * pricing.input) / 1000000;
    const outputCost = (tokens.completion_tokens * pricing.output) / 1000000;
    const totalCost = inputCost + outputCost;
    
    return {
      totalCost,
      currency: pricing.currency,
      inputCost,
      outputCost
    };
  }

  /**
   * 综合估算 token 和费用
   * 
   * @param prompt Prompt 文本
   * @param completion Completion 文本（AI 响应）
   * @param model 模型名称
   * @returns 完整的估算结果
   */
  estimateTokensAndCost(
    prompt: string,
    completion: string,
    model: string = DEFAULT_MODEL
  ): TokenAndCostEstimate {
    const promptTokens = this.estimateTokens(prompt);
    const completionTokens = this.estimateTokens(completion);
    
    const usage: TokenUsage = {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens
    };
    
    const cost = this.calculateCost(usage, model);
    
    return {
      usage,
      cost,
      model
    };
  }

  /**
   * 从 API 返回的 usage 数据计算费用
   * 
   * @param apiUsage API 返回的 usage 对象
   * @param model 模型名称
   * @returns 费用估算
   */
  calculateCostFromAPIUsage(
    apiUsage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number },
    model: string = DEFAULT_MODEL
  ): CostEstimate {
    const usage: TokenUsage = {
      prompt_tokens: apiUsage.prompt_tokens || 0,
      completion_tokens: apiUsage.completion_tokens || 0,
      total_tokens: apiUsage.total_tokens || 
        (apiUsage.prompt_tokens || 0) + (apiUsage.completion_tokens || 0)
    };
    
    return this.calculateCost(usage, model);
  }

  /**
   * 格式化费用显示
   * 
   * @param amount 金额
   * @param currency 货币代码
   * @returns 格式化后的字符串
   */
  formatCost(amount: number, currency: string = 'CNY'): string {
    const symbol = currency === 'CNY' ? '¥' : '$';
    if (amount < 0.01) return `${symbol}<0.01`;
    return `${symbol}${amount.toFixed(4)}`;
  }

  /**
   * 格式化 token 数量显示
   * 
   * @param tokens Token 数量
   * @returns 格式化后的字符串
   */
  formatTokens(tokens: number): string {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}k`;
    }
    return tokens.toString();
  }

  /**
   * 获取模型的定价信息
   * 
   * @param model 模型名称
   * @returns 定价配置
   */
  getModelPricing(model: string = DEFAULT_MODEL): ModelPricing {
    return MODEL_PRICING[model] || MODEL_PRICING[DEFAULT_MODEL];
  }

  /**
   * 获取所有支持的模型列表
   * 
   * @returns 模型名称数组
   */
  getSupportedModels(): string[] {
    return Object.keys(MODEL_PRICING);
  }

  /**
   * 注册自定义模型定价
   * 
   * @param name 模型名称
   * @param pricing 定价配置
   */
  registerModel(name: string, pricing: ModelPricing): void {
    MODEL_PRICING[name] = pricing;
  }

  /**
   * 批量估算多个文本的 token（用于计算多个 prompt 的总 token）
   * 
   * @param texts 文本数组
   * @returns 总 token 数量
   */
  estimateBatchTokens(texts: string[]): number {
    return texts.reduce((total, text) => total + this.estimateTokens(text), 0);
  }

  /**
   * 计算上下文窗口使用率
   * 
   * @param currentTokens 当前 token 数量
   * @param maxTokens 最大上下文长度（默认 128k）
   * @returns 使用率（0-100）
   */
  calculateContextUsage(currentTokens: number, maxTokens: number = 128000): number {
    return Math.min((currentTokens / maxTokens) * 100, 100);
  }
}

// 导出单例实例
export const tokenCalculationService = new TokenCalculationService();

// 默认导出
export default TokenCalculationService;
