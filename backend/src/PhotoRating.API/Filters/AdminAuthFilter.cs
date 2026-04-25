using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace PhotoRating.API.Filters;

public class AdminAuthFilter(IConfiguration config) : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        var key = context.HttpContext.Request.Headers["X-Admin-Key"].FirstOrDefault();
        var expected = config["AdminKey"];
        if (string.IsNullOrEmpty(expected) || key != expected)
            context.Result = new UnauthorizedResult();
    }

    public void OnActionExecuted(ActionExecutedContext context) { }
}
