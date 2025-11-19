# AirbnbClone Unit Tests

This folder is set up for unit testing the backend of your AirbnbClone project.

## Recommended Folder Structure

```
AirbnbCloneUnitTests/
├── AirbnbCloneUnitTests.csproj
├── bin/
├── obj/
├── Helpers/           # Test helpers, mocks, stubs
├── Services/          # Service layer tests
├── Controllers/       # API controller tests
├── Entities/          # Entity/model tests
├── TestData/          # Sample data for tests
└── Utils/             # Utility/test extensions
```

## Next Steps
- Place your test classes in the appropriate folders above.
- Use xUnit as the test framework (recommended for .NET Core).
- Add Moq for mocking dependencies.
- Reference your main backend projects (Core, Application, Infrastructure, Api).

---
