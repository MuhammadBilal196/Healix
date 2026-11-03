import { MarketplaceRepository } from '../../marketplace/marketplace.repository';
import { ContractRepository } from '../contract.repository';
import { AppError } from '../../../../common/errors/AppError';
import { HTTP_STATUS } from '../../../../common/constants/index';
import { notifyContractParties } from '../contract.notifications';

export class CreateContractFromOfferUseCase {
  constructor() {}

  async execute(listingId: string, offerId: string) {
    // 1. Load Offer & Listing using Repository
    const listing = await MarketplaceRepository.findListingById(listingId);
    if (!listing) throw new AppError('Listing not found', HTTP_STATUS.NOT_FOUND);
    if (listing.status !== 'CLOSED') {
      throw new AppError(`Cannot create contract: Listing is ${listing.status}, must be CLOSED.`, HTTP_STATUS.BAD_REQUEST);
    }

    const offer = await MarketplaceRepository.findOfferById(offerId);
    if (!offer) throw new AppError('Offer not found', HTTP_STATUS.NOT_FOUND);
    if (offer.listingId !== listingId) throw new AppError('Offer does not belong to this listing', HTTP_STATUS.CONFLICT);
    if (offer.status !== 'ACCEPTED') {
      throw new AppError(`Cannot create contract: Offer is ${offer.status}, must be ACCEPTED.`, HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Idempotency Check: Does a Contract already exist for this sourceOfferId?
    const existingContract = await ContractRepository.findContractBySourceOfferId(offerId);
    if (existingContract) {
      console.log(`[Contract Domain] Contract already exists for offer ${offerId}. Returning existing.`);
      return existingContract;
    }

    // 3. Create exactly one Contract
    const contract = await ContractRepository.createContract({
      patientId: listing.careRequest.patientId,
      nurseId: offer.nurseId,
      sourceOfferId: offer.id,
      careRequestId: listing.careRequestId,
      price: offer.price,
      priceType: offer.priceType,
      scopeText: listing.careRequest.notes || 'Home nursing care visit.',
      actorId: 'SYSTEM',
      actorRole: 'SYSTEM'
    });

    // A contract nobody is told about is never approved: alert the nurse and the patient.
    await notifyContractParties(contract.id, 'CREATED');

    return contract;
  }
}
