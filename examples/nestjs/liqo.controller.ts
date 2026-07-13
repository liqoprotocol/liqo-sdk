// NestJS — controller exposing checkout + webhook endpoints.
import { Body, Controller, Get, Headers, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { LiqoApiError, LiqoSdkError } from '@liqo/sdk';
import { LiqoService } from './liqo.service';

@Controller()
export class LiqoController {
  constructor(private readonly liqo: LiqoService) {}

  @Post('api/checkout')
  async createCheckout(@Body() body: any, @Res() res: Response) {
    try {
      const checkout = await this.liqo.createPayment({
        amount: body.amount,
        fromCurrency: body.fromCurrency,
        toAsset: body.toAsset,
        toWallet: body.toWallet,
        payerEmail: body.payerEmail,
        targetChain: body.targetChain ?? 'stellar',
        successUrl: 'https://yourapp.com/success',
        cancelUrl: 'https://yourapp.com/cancel',
        idempotencyKey: body.orderId,
      });
      return res.json({ checkoutUrl: checkout.checkoutUrl, token: checkout.session.token });
    } catch (err) {
      if (err instanceof LiqoSdkError) return res.status(400).json({ error: err.message });
      if (err instanceof LiqoApiError) return res.status(err.statusCode ?? 502).json({ code: err.code, error: err.message });
      return res.status(500).json({ error: 'Unexpected error' });
    }
  }

  @Get('api/checkout/:token')
  async getCheckout(@Param('token') token: string, @Res() res: Response) {
    const session = await this.liqo.getSession(token);
    return res.json(session);
  }

  // Configure a raw-body parser for this route in main.ts (see README).
  @Post('webhooks/liqo')
  handleWebhook(@Req() req: Request, @Headers() headers: Record<string, string>, @Res() res: Response) {
    try {
      const event = this.liqo.verifyWebhook(req.body, headers); // req.body must be the raw Buffer
      res.sendStatus(200);
      if (event.event === 'transaction.completed') {
        // fulfill order for event.data.transactionId
      }
    } catch {
      res.sendStatus(400);
    }
  }
}
