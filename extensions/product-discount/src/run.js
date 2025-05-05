// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";
import discount from "./discount.json";

// Use JSDoc annotations for type safety
/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {import("../generated/api").Target} Target
 * @typedef {import("../generated/api").ProductVariant} ProductVariant
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * Determines the discount percentage based on quantity
 * @param {number} quantity
 * @returns {number}
 */
function getDiscountPercentage(quantity) {
  const discountTier = discount.discounts.find(
    tier => quantity >= tier.min && quantity <= tier.max
  );
  return discountTier ? discountTier.percentage : 0;
}

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  // Process each cart line to find eligible discounts
  const discountTargets = input.cart.lines
    .map(line => {
      const quantity = line.quantity;
      const discountPercentage = getDiscountPercentage(quantity);
      
      if (discountPercentage > 0) {
        return {
          target: /** @type {Target} */ ({
            cartLine: { id: line.id }
          }),
          percentage: discountPercentage
        };
      }
      return null;
    })
    .filter(item => item !== null);

  // If no items qualify for discount
  if (!discountTargets.length) {
    console.error("No cart lines qualify for volume discount.");
    return EMPTY_DISCOUNT;
  }

  // Create discounts array with appropriate targets and percentages
  return {
    discounts: discountTargets.map(target => ({
      targets: [target.target],
      value: {
        percentage: {
          value: target.percentage.toString()
        }
      }
    })),
    discountApplicationStrategy: DiscountApplicationStrategy.First
  };
}
