const SandboxedModule = require('sandboxed-module')
const sinon = require('sinon')
const { assert } = require('chai')
const {
  RecurlyAccount,
  RecurlySubscription,
  RecurlySubscriptionAddOn,
  RecurlySubscriptionChange,
} = require('../../../../app/src/Features/Subscription/RecurlyEntities')

const modulePath =
  '../../../../app/src/Features/Subscription/SubscriptionViewModelBuilder'

describe('SubscriptionViewModelBuilder', function () {
  beforeEach(function () {
    this.user = { _id: '5208dd34438842e2db333333' }
    this.recurlySubscription_id = '123abc456def'
    this.planCode = 'collaborator_monthly'
    this.planFeatures = {
      compileGroup: 'priority',
      collaborators: -1,
      compileTimeout: 240,
    }
    this.plan = {
      planCode: this.planCode,
      features: this.planFeatures,
    }
    this.individualSubscription = {
      planCode: this.planCode,
      plan: this.plan,
      recurlySubscription_id: this.recurlySubscription_id,
      recurlyStatus: {
        state: 'active',
      },
    }
    this.recurlySubscription = new RecurlySubscription({
      id: this.recurlySubscription_id,
      userId: this.user._id,
      currency: 'EUR',
      planCode: 'plan-code',
      planName: 'plan-name',
      planPrice: 13,
      addOns: [
        new RecurlySubscriptionAddOn({
          code: 'addon-code',
          name: 'addon name',
          quantity: 1,
          unitPrice: 2,
        }),
      ],
      subtotal: 15,
      taxRate: 0.1,
      taxAmount: 1.5,
      total: 16.5,
      periodStart: new Date('2025-01-20T12:00:00.000Z'),
      periodEnd: new Date('2025-02-20T12:00:00.000Z'),
      collectionMethod: 'automatic',
    })

    this.individualCustomSubscription = {
      planCode: this.planCode,
      plan: this.plan,
      recurlySubscription_id: this.recurlySubscription_id,
    }

    this.groupPlanCode = 'group_collaborator_monthly'
    this.groupPlanFeatures = {
      compileGroup: 'priority',
      collaborators: 10,
      compileTimeout: 240,
    }
    this.groupPlan = {
      planCode: this.groupPlanCode,
      features: this.groupPlanFeatures,
      membersLimit: 4,
      membersLimitAddOn: 'additional-license',
    }
    this.groupSubscription = {
      planCode: this.groupPlanCode,
      plan: this.plan,
      recurlyStatus: {
        state: 'active',
      },
    }

    this.commonsPlanCode = 'commons_license'
    this.commonsPlanFeatures = {
      compileGroup: 'priority',
      collaborators: '-1',
      compileTimeout: 240,
    }
    this.commonsPlan = {
      planCode: this.commonsPlanCode,
      features: this.commonsPlanFeatures,
    }
    this.commonsSubscription = {
      planCode: this.commonsPlanCode,
      plan: this.commonsPlan,
      name: 'Digital Science',
    }

    this.Settings = {
      institutionPlanCode: this.commonsPlanCode,
    }
    this.SubscriptionLocator = {
      promises: {
        getUsersSubscription: sinon.stub().resolves(),
        getMemberSubscriptions: sinon.stub().resolves(),
      },
      getUsersSubscription: sinon.stub().yields(),
      getMemberSubscriptions: sinon.stub().yields(null, []),
      getManagedGroupSubscriptions: sinon.stub().yields(null, []),
      findLocalPlanInSettings: sinon.stub(),
    }
    this.InstitutionsGetter = {
      promises: {
        getCurrentInstitutionsWithLicence: sinon.stub().resolves(),
      },
      getCurrentInstitutionsWithLicence: sinon.stub().yields(null, []),
      getManagedInstitutions: sinon.stub().yields(null, []),
    }
    this.InstitutionsManager = {
      promises: {
        fetchV1Data: sinon.stub().resolves(),
      },
    }
    this.PublishersGetter = {
      promises: {
        fetchV1Data: sinon.stub().resolves(),
      },
      getManagedPublishers: sinon.stub().yields(null, []),
    }
    this.RecurlyWrapper = {
      promises: {
        getSubscription: sinon.stub().resolves(),
      },
    }
    this.SubscriptionUpdater = {
      promises: {
        updateSubscriptionFromRecurly: sinon.stub().resolves(),
      },
    }
    this.PlansLocator = {
      findLocalPlanInSettings: sinon.stub(),
    }
    this.PaymentService = {
      getPaymentFromRecord: sinon.stub().yields(),
    }
    this.SubscriptionViewModelBuilder = SandboxedModule.require(modulePath, {
      requires: {
        '@overleaf/settings': this.Settings,
        './SubscriptionLocator': this.SubscriptionLocator,
        '../Institutions/InstitutionsGetter': this.InstitutionsGetter,
        '../Institutions/InstitutionsManager': this.InstitutionsManager,
        './RecurlyWrapper': this.RecurlyWrapper,
        './SubscriptionUpdater': this.SubscriptionUpdater,
        './PlansLocator': this.PlansLocator,
        './PaymentService': this.PaymentService,
        './V1SubscriptionManager': {},
        '../Publishers/PublishersGetter': this.PublishersGetter,
        './SubscriptionHelper': {},
      },
    })

    this.PlansLocator.findLocalPlanInSettings
      .withArgs(this.planCode)
      .returns(this.plan)
      .withArgs(this.groupPlanCode)
      .returns(this.groupPlan)
      .withArgs(this.commonsPlanCode)
      .returns(this.commonsPlan)
  })

  describe('getBestSubscription', function () {
    it('should return a free plan when user has no subscription or affiliation', async function () {
      const usersBestSubscription =
        await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
          this.user
        )
      assert.deepEqual(usersBestSubscription, { type: 'free' })
    })

    describe('with a individual subscription only', function () {
      it('should return a individual subscription when user has non-Recurly one', async function () {
        this.SubscriptionLocator.promises.getUsersSubscription
          .withArgs(this.user)
          .resolves(this.individualCustomSubscription)

        const usersBestSubscription =
          await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
            this.user
          )

        assert.deepEqual(usersBestSubscription, {
          type: 'individual',
          subscription: this.individualCustomSubscription,
          plan: this.plan,
          remainingTrialDays: -1,
        })
      })

      it('should return a individual subscription when user has an active one', async function () {
        this.SubscriptionLocator.promises.getUsersSubscription
          .withArgs(this.user)
          .resolves(this.individualSubscription)

        const usersBestSubscription =
          await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
            this.user
          )

        assert.deepEqual(usersBestSubscription, {
          type: 'individual',
          subscription: this.individualSubscription,
          plan: this.plan,
          remainingTrialDays: -1,
        })
      })

      it('should return a individual subscription with remaining free trial days', async function () {
        const threeDaysLater = new Date()
        threeDaysLater.setDate(threeDaysLater.getDate() + 3)
        this.individualSubscription.recurlyStatus.trialEndsAt = threeDaysLater
        this.SubscriptionLocator.promises.getUsersSubscription
          .withArgs(this.user)
          .resolves(this.individualSubscription)

        const usersBestSubscription =
          await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
            this.user
          )

        assert.deepEqual(usersBestSubscription, {
          type: 'individual',
          subscription: this.individualSubscription,
          plan: this.plan,
          remainingTrialDays: 3,
        })
      })

      it('should return a individual subscription with free trial on last day', async function () {
        const threeHoursLater = new Date()
        threeHoursLater.setTime(threeHoursLater.getTime() + 3 * 60 * 60 * 1000)
        this.individualSubscription.recurlyStatus.trialEndsAt = threeHoursLater
        this.SubscriptionLocator.promises.getUsersSubscription
          .withArgs(this.user)
          .resolves(this.individualSubscription)

        const usersBestSubscription =
          await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
            this.user
          )

        assert.deepEqual(usersBestSubscription, {
          type: 'individual',
          subscription: this.individualSubscription,
          plan: this.plan,
          remainingTrialDays: 1,
        })
      })

      it('should update subscription if recurly data is missing', async function () {
        this.individualSubscriptionWithoutRecurly = {
          planCode: this.planCode,
          plan: this.plan,
          recurlySubscription_id: this.recurlySubscription_id,
        }
        this.recurlySubscription = {
          state: 'active',
        }
        this.SubscriptionLocator.promises.getUsersSubscription
          .withArgs(this.user)
          .onCall(0)
          .resolves(this.individualSubscriptionWithoutRecurly)
          .withArgs(this.user)
          .onCall(1)
          .resolves(this.individualSubscription)
        this.RecurlyWrapper.promises.getSubscription
          .withArgs(this.individualSubscription.recurlySubscription_id, {
            includeAccount: true,
          })
          .resolves(this.recurlySubscription)

        const usersBestSubscription =
          await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
            this.user
          )

        sinon.assert.calledWith(
          this.RecurlyWrapper.promises.getSubscription,
          this.individualSubscriptionWithoutRecurly.recurlySubscription_id,
          { includeAccount: true }
        )
        sinon.assert.calledWith(
          this.SubscriptionUpdater.promises.updateSubscriptionFromRecurly,
          this.recurlySubscription,
          this.individualSubscriptionWithoutRecurly
        )
        assert.deepEqual(usersBestSubscription, {
          type: 'individual',
          subscription: this.individualSubscription,
          plan: this.plan,
          remainingTrialDays: -1,
        })
      })
    })

    it('should return a group subscription when user has one', async function () {
      this.SubscriptionLocator.promises.getMemberSubscriptions
        .withArgs(this.user)
        .resolves([this.groupSubscription])
      const usersBestSubscription =
        await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
          this.user
        )
      assert.deepEqual(usersBestSubscription, {
        type: 'group',
        subscription: {},
        plan: this.groupPlan,
        remainingTrialDays: -1,
      })
    })

    it('should return a group subscription with team name when user has one', async function () {
      this.SubscriptionLocator.promises.getMemberSubscriptions
        .withArgs(this.user)
        .resolves([
          Object.assign({}, this.groupSubscription, { teamName: 'test team' }),
        ])
      const usersBestSubscription =
        await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
          this.user
        )
      assert.deepEqual(usersBestSubscription, {
        type: 'group',
        subscription: { teamName: 'test team' },
        plan: this.groupPlan,
        remainingTrialDays: -1,
      })
    })

    it('should return a commons subscription when user has an institution affiliation', async function () {
      this.InstitutionsGetter.promises.getCurrentInstitutionsWithLicence
        .withArgs(this.user._id)
        .resolves([this.commonsSubscription])

      const usersBestSubscription =
        await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
          this.user
        )

      assert.deepEqual(usersBestSubscription, {
        type: 'commons',
        subscription: this.commonsSubscription,
        plan: this.commonsPlan,
      })
    })

    describe('with multiple subscriptions', function () {
      beforeEach(function () {
        this.SubscriptionLocator.promises.getUsersSubscription
          .withArgs(this.user)
          .resolves(this.individualSubscription)
        this.SubscriptionLocator.promises.getMemberSubscriptions
          .withArgs(this.user)
          .resolves([this.groupSubscription])
        this.InstitutionsGetter.promises.getCurrentInstitutionsWithLicence
          .withArgs(this.user._id)
          .resolves([this.commonsSubscription])
      })

      it('should return individual when the individual subscription has the best feature set', async function () {
        this.commonsPlan.features = {
          compileGroup: 'standard',
          collaborators: 1,
          compileTimeout: 60,
        }

        const usersBestSubscription =
          await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
            this.user
          )

        assert.deepEqual(usersBestSubscription, {
          type: 'individual',
          subscription: this.individualSubscription,
          plan: this.plan,
          remainingTrialDays: -1,
        })
      })

      it('should return group when the group subscription has the best feature set', async function () {
        this.plan.features = {
          compileGroup: 'standard',
          collaborators: 1,
          compileTimeout: 60,
        }
        this.commonsPlan.features = {
          compileGroup: 'standard',
          collaborators: 1,
          compileTimeout: 60,
        }

        const usersBestSubscription =
          await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
            this.user
          )

        assert.deepEqual(usersBestSubscription, {
          type: 'group',
          subscription: {},
          plan: this.groupPlan,
          remainingTrialDays: -1,
        })
      })

      it('should return commons when the commons affiliation has the best feature set', async function () {
        this.plan.features = {
          compileGroup: 'priority',
          collaborators: 5,
          compileTimeout: 240,
        }
        this.groupPlan.features = {
          compileGroup: 'standard',
          collaborators: 1,
          compileTimeout: 60,
        }
        this.commonsPlan.features = {
          compileGroup: 'priority',
          collaborators: -1,
          compileTimeout: 240,
        }

        const usersBestSubscription =
          await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
            this.user
          )

        assert.deepEqual(usersBestSubscription, {
          type: 'commons',
          subscription: this.commonsSubscription,
          plan: this.commonsPlan,
        })
      })

      it('should return individual with equal feature sets', async function () {
        this.plan.features = {
          compileGroup: 'priority',
          collaborators: -1,
          compileTimeout: 240,
        }
        this.groupPlan.features = {
          compileGroup: 'priority',
          collaborators: -1,
          compileTimeout: 240,
        }
        this.commonsPlan.features = {
          compileGroup: 'priority',
          collaborators: -1,
          compileTimeout: 240,
        }

        const usersBestSubscription =
          await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
            this.user
          )

        assert.deepEqual(usersBestSubscription, {
          type: 'individual',
          subscription: this.individualSubscription,
          plan: this.plan,
          remainingTrialDays: -1,
        })
      })

      it('should return group over commons with equal feature sets', async function () {
        this.plan.features = {
          compileGroup: 'standard',
          collaborators: 1,
          compileTimeout: 60,
        }
        this.groupPlan.features = {
          compileGroup: 'priority',
          collaborators: -1,
          compileTimeout: 240,
        }
        this.commonsPlan.features = {
          compileGroup: 'priority',
          collaborators: -1,
          compileTimeout: 240,
        }

        const usersBestSubscription =
          await this.SubscriptionViewModelBuilder.promises.getBestSubscription(
            this.user
          )

        assert.deepEqual(usersBestSubscription, {
          type: 'group',
          subscription: {},
          plan: this.groupPlan,
          remainingTrialDays: -1,
        })
      })
    })
  })

  describe('buildUsersSubscriptionViewModel', function () {
    describe('with a recurly subscription', function () {
      it('adds recurly data to the personal subscription', async function () {
        this.SubscriptionLocator.getUsersSubscription.yields(
          null,
          this.individualSubscription
        )
        this.PaymentService.getPaymentFromRecord.yields(null, {
          subscription: this.recurlySubscription,
          account: new RecurlyAccount({
            email: 'example@example.com',
            hasPastDueInvoice: false,
          }),
          coupons: [],
        })
        const result =
          await this.SubscriptionViewModelBuilder.promises.buildUsersSubscriptionViewModel(
            this.user
          )
        assert.deepEqual(result.personalSubscription.recurly, {
          tax: 1.5,
          taxRate: 0.1,
          billingDetailsLink: '/user/subscription/recurly/billing-details',
          accountManagementLink:
            '/user/subscription/recurly/account-management',
          additionalLicenses: 0,
          addOns: [
            {
              code: 'addon-code',
              name: 'addon name',
              quantity: 1,
              unitPrice: 2,
              preTaxTotal: 2,
            },
          ],
          totalLicenses: 0,
          nextPaymentDueAt: 'February 20th, 2025 12:00 PM UTC',
          nextPaymentDueDate: 'February 20th, 2025',
          currency: 'EUR',
          state: 'active',
          trialEndsAtFormatted: null,
          trialEndsAt: null,
          activeCoupons: [],
          accountEmail: 'example@example.com',
          hasPastDueInvoice: false,
          pausedAt: null,
          remainingPauseCycles: null,
          displayPrice: '€16.50',
          planOnlyDisplayPrice: '€14.30',
          addOnDisplayPricesWithoutAdditionalLicense: {
            'addon-code': '€2.20',
          },
        })
      })

      it('includes pending changes', async function () {
        this.SubscriptionLocator.getUsersSubscription.yields(
          null,
          this.individualSubscription
        )
        this.recurlySubscription.pendingChange = new RecurlySubscriptionChange({
          subscription: this.recurlySubscription,
          nextPlanCode: this.groupPlanCode,
          nextPlanName: 'Group Collaborator (Annual) 4 licenses',
          nextPlanPrice: 1400,
          nextAddOns: [
            new RecurlySubscriptionAddOn({
              code: 'additional-license',
              name: 'additional license',
              quantity: 8,
              unitPrice: 24.4,
            }),
            new RecurlySubscriptionAddOn({
              code: 'addon-code',
              name: 'addon name',
              quantity: 1,
              unitPrice: 2,
            }),
          ],
        })
        this.PaymentService.getPaymentFromRecord.yields(null, {
          subscription: this.recurlySubscription,
          account: {},
          coupons: [],
        })
        const result =
          await this.SubscriptionViewModelBuilder.promises.buildUsersSubscriptionViewModel(
            this.user
          )
        assert.equal(
          result.personalSubscription.recurly.displayPrice,
          '€1,756.92'
        )
        assert.equal(
          result.personalSubscription.recurly.currentPlanDisplayPrice,
          '€16.50'
        )
        assert.equal(
          result.personalSubscription.recurly.planOnlyDisplayPrice,
          '€1,754.72'
        )
        assert.deepEqual(
          result.personalSubscription.recurly
            .addOnDisplayPricesWithoutAdditionalLicense,
          { 'addon-code': '€2.20' }
        )
        assert.equal(
          result.personalSubscription.recurly.pendingAdditionalLicenses,
          8
        )
        assert.equal(
          result.personalSubscription.recurly.pendingTotalLicenses,
          12
        )
      })
    })
  })
})
