using AirbnbClone.Infrastructure.Services.Interfaces;
using Hangfire;
using System.Linq.Expressions;

namespace AirbnbClone.Infrastructure.Services
{
    public class HangfireJobService : IBackgroundJobService
    {
        private readonly IBackgroundJobClient _backgroundJobClient;
        private readonly IRecurringJobManager _recurringJobManager;

        // We inject Hangfire's native interfaces here
        public HangfireJobService(IBackgroundJobClient backgroundJobClient, IRecurringJobManager recurringJobManager)
        {
            _backgroundJobClient = backgroundJobClient;
            _recurringJobManager = recurringJobManager;
        }

        public void Enqueue(Expression<Action> methodCall)
        {
            _backgroundJobClient.Enqueue(methodCall);
        }

        public void Schedule(Expression<Action> methodCall, TimeSpan delay)
        {
            _backgroundJobClient.Schedule(methodCall, delay);
        }

        public void Recur(string jobId, Expression<Action> methodCall, string cronExpression)
        {
            _recurringJobManager.AddOrUpdate(jobId, methodCall, cronExpression);
        }
    }
}