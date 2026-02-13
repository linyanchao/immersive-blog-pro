/*
 * @Author: linyc
 * @Date: 2026-02-13 13:44:58
 * @LastEditTime: 2026-02-13 13:45:00
 * @LastEditors: linyc
 * @Description: 
 */
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const unique = (arr) => [...new Set(arr)];