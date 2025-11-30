using System.Linq.Expressions;

namespace Core.Interfaces
{
    public interface IBackgroundJobService
    {
        // 1. Fire-and-Forget (Static/Instance agnostic)
        void Enqueue(Expression<Action> methodCall);

        // 2. Fire-and-Forget (Type-Safe / Interface based)
        // This is the one required to fix the "Serialization Error" in PaymentService
        void Enqueue<T>(Expression<Action<T>> methodCall);

        // 3. Delayed
        void Schedule(Expression<Action> methodCall, TimeSpan delay);

        // 4. Recurring
        void Recur(string jobId, Expression<Action> methodCall, string cronExpression);
    }
}