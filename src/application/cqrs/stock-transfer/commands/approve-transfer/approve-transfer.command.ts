export class ApproveTransferCommand {
  constructor(
    public readonly transferId: string,
    public readonly approverUserId: string,
  ) {}
}