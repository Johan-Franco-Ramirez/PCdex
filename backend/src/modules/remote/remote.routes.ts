import { Router } from 'express';
import { categoryView, check, detail, list } from './remote.service.js';
export const remoteRouter=Router();
remoteRouter.get('/categories',(_req,res)=>{res.json(categoryView());});
remoteRouter.get('/components/category/:category',async(req,res)=>{res.json(await list({...req.query,category:req.params.category}));});
remoteRouter.get('/components',async(req,res)=>{res.json(await list(req.query));});
remoteRouter.get('/components/:id',async(req,res)=>{res.json(await detail(req.params.id));});
remoteRouter.post('/compatibility/check',async(req,res)=>{res.json(await check(req.body));});
