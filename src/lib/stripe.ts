import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export interface StripePaymentWithProgram {
  id: string
  amount: number
  currency: string
  status: string
  program_name: string
  created: number
}

export async function fetchStripeTransactions(
  limit: number = 100,
  startingAfter?: string
): Promise<StripePaymentWithProgram[]> {
  try {
    const charges = await stripe.charges.list({
      limit,
      starting_after: startingAfter,
      expand: ['data.payment_intent'],
    })
    console.log(charges)

    const transactions: StripePaymentWithProgram[] = []

    for (const charge of charges.data) {
      // Skip refunded charges
      if (charge.refunded) {
        console.log(`Skipping refunded charge ${charge.id}`)
        continue
      }

      let programName = ''
      console.log(`Processing charge ${charge.id}:`)
      console.log(`- Charge metadata:`, charge.metadata)
      
      if (charge.payment_intent && typeof charge.payment_intent === 'object') {
        const paymentIntent = charge.payment_intent as Stripe.PaymentIntent
        console.log(`- Payment Intent metadata:`, paymentIntent.metadata)
        
        if (paymentIntent.metadata && paymentIntent.metadata.program_name) {
          programName = paymentIntent.metadata.program_name
          console.log(`- Found program name in PI metadata: ${programName}`)
        } else if (charge.metadata && charge.metadata.program_name) {
          programName = charge.metadata.program_name
          console.log(`- Found program name in charge metadata: ${programName}`)
        }
        
        if (!programName && paymentIntent.latest_charge) {
          try {
            console.log(`- Checking checkout sessions for PI: ${paymentIntent.id}`)
            const session = await stripe.checkout.sessions.list({
              payment_intent: paymentIntent.id,
              limit: 1,
            })
            
            console.log(`- Found ${session.data.length} checkout sessions`)
            if (session.data.length > 0) {
              console.log(`- Session custom fields:`, session.data[0].custom_fields)
              if (session.data[0].custom_fields) {
                const programField = session.data[0].custom_fields.find(
                  field => field.key === 'program'
                )
                if (programField && programField.text) {
                  programName = programField.text.value
                  console.log(`- Found program name in custom field: ${programName}`)
                }
              }
            }
          } catch (error) {
            console.warn('Could not fetch checkout session:', error)
          }
        }
      }

      // For testing purposes, if no program name is found, use a default
      if (!programName) {
        programName = 'Unknown Program'
        console.log(`- No program name found, using default: ${programName}`)
      }

      transactions.push({
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        program_name: programName,
        created: charge.created,
      })
    }

    return transactions
  } catch (error) {
    console.error('Error fetching Stripe transactions:', error)
    throw error
  }
}

export async function getStripeTransaction(chargeId: string): Promise<StripePaymentWithProgram | null> {
  try {
    const charge = await stripe.charges.retrieve(chargeId, {
      expand: ['payment_intent'],
    })

    let programName = ''
    
    if (charge.payment_intent && typeof charge.payment_intent === 'object') {
      const paymentIntent = charge.payment_intent as Stripe.PaymentIntent
      
      if (paymentIntent.metadata && paymentIntent.metadata.program_name) {
        programName = paymentIntent.metadata.program_name
      } else if (charge.metadata && charge.metadata.program_name) {
        programName = charge.metadata.program_name
      }
      
      if (!programName && paymentIntent.latest_charge) {
        try {
          const session = await stripe.checkout.sessions.list({
            payment_intent: paymentIntent.id,
            limit: 1,
          })
          
          if (session.data.length > 0 && session.data[0].custom_fields) {
            const programField = session.data[0].custom_fields.find(
              field => field.key === 'program'
            )
            if (programField && programField.text) {
              programName = programField.text.value
            }
          }
        } catch (error) {
          console.warn('Could not fetch checkout session:', error)
        }
      }
    }

    if (!programName) {
      return null
    }

    return {
      id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      program_name: programName,
      created: charge.created,
    }
  } catch (error) {
    console.error('Error fetching Stripe transaction:', error)
    throw error
  }
}