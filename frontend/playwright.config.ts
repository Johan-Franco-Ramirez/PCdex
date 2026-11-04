import {defineConfig} from '@playwright/test'
export default defineConfig({testDir:'./scripts',testMatch:'functional.spec.ts',workers:1,timeout:60000,use:{headless:true,screenshot:'only-on-failure',trace:'retain-on-failure'},reporter:'list'})
