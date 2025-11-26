using System.Linq.Expressions;

namespace AirbnbClone.Infrastructure.Services.Interfaces
{
    public interface IBackgroundJobService
    {
        // 1. Fire-and-Forget: "Do this now (or as soon as possible)"
        // Used for: Emails, AI Processing, Stripe Webhook handling
        void Enqueue(Expression<Action> methodCall);

        // 2. Delayed: "Do this in X minutes"
        // Used for: "Remind user in 24 hours to review", "Check payment status in 5 mins"
        void Schedule(Expression<Action> methodCall, TimeSpan delay);

        // 3. Recurring: "Do this every day" (Optional, but good to have)
        // Used for: Database cleanup, Daily reports
        void Recur(string jobId, Expression<Action> methodCall, string cronExpression);
    }
}