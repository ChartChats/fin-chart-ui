# Contributing Guide

Welcome! This project follows a clean, opinionated structure using a **Model-Service-View (MSV)** architecture alongside
registries, factories, and toolkits. To maintain clarity, consistency, and scalability, please follow the rules and
guidelines outlined below before contributing.

> ✨ Tip: When unsure, refer to a similar file and follow its structure and conventions.

---

## 🔧 Project Structure---

```
app/
├── api/              # All FastAPI endpoint files
├── model/            # Abstract/base classes and enums
│   └── enums/        # All enum definitions
├── service/          # Business logic grouped by domain
│   └── chart_patterns/, indicators/, toolkits/, etc.
├── factory/          # Factory classes and registries
│   └── registry/     # Enum registries for patterns, indicators, toolkits

research_and_experimentation/
└── /    # For ad-hoc testing and exploration (rough notebook)
```

---

## 🚦 API Layer (`app/api/`)

- Each endpoint must be defined in its **own file**.
- Each file must include:
    - The route function
    - The corresponding Pydantic model(s) for input validation
- All API functions:
    - Must use **only named parameters**
    - Must be **pure functions** (i.e., no business logic)
- Use Pydantic models for **request validation**

---

## 📦 Model Layer (`app/model/`)

- Contains:
    - Abstract base classes like `ChartPattern`, `Indicator`, `Toolkit`
    - Interfaces or foundational logic
- Conventions:
    - Use **snake_case** for all function names
    - Implement classes as **singletons**, unless impossible
    - Minimize state (use as few instance variables as possible)
    - Include **docstrings** for every class and method

---

## ⚙️ Service Layer (`app/service/`)

- Contains actual implementation logic for indicators, chart patterns, toolkits, etc.
- Organized in subdirectories such as:
    - `chart_patterns/`
    - `indicators/`
    - `toolkits/`
- Conventions:
    - Only subdirectory names may be **plural**
    - File names must always be **singular** (e.g., `sma.py`, `head_and_shoulders.py`)
- Each service class must:
    - Inherit from a base model class
    - Declare default configuration as **class variables** at the top (e.g., `DEFAULT_WINDOW = 14`)
    - Include full **class-level and method-level docstrings**
    - Be implemented in a singleton manner

---

## 🏭 Factory Layer (`app/factory/`)

- Factory classes:
    - Must be implemented as **singletons**
    - Should expose **only static methods**
    - Must be used to instantiate core objects (i.e., **do not manually instantiate** service classes)
- Enum-based registries are stored in `factory/registry/` and should map names to classes
- Factory methods must:
    - Use only **named parameters**
    - Include **type annotations and complete docstrings**

---

## 🧰 Toolkit System

- Toolkit classes live in `service/toolkits/` and inherit from the base `Toolkit` model
- Rules:
    - All toolkit methods must be `@staticmethod`
    - Each toolkit class must be registered in `ToolkitRegistry`
    - All methods should be retrievable using `ToolkitFactory.get_tools(...)`
    - **All toolkit methods must have zero required arguments**, so the LLM can fall back to default values if it misses
      one
    - Every toolkit method must be clearly documented

---

## ✅ General Coding Guidelines

- ✅ Use **snake_case** for all function and variable names
- ✅ Keep **function and class names** clear and meaningful
- ✅ All classes and methods must include **docstrings**
- ✅ Use **type hints and casting** everywhere
- ✅ Use **fully-qualified imports** (e.g., `from app.services.indicators.sma import SMA`)
- ✅ Keep logic modular and DRY (Don’t Repeat Yourself)
- ✅ Use factories to retrieve **all core service/toolkit/chart pattern/indicator instances**
- ✅ All core classes (Indicators, ChartPatterns, Toolkits) must:
    - Begin with class-level default config values (e.g., `DEFAULT_SENSITIVITY`)
    - Be registered in the corresponding `Registry` enum
    - Be optionally included in the appropriate `Toolkit`
- ✅ Do not leave warnings ignored, please resolve them, avoid the yellow wiggly lines!

---

## 🧪 Example: Chart Pattern

- Inherit from `ChartPattern` (in `model/chart_pattern.py`)
- Implement the logic in `service/chart_patterns/<pattern_name>.py`
- Register the class in `ChartPatternRegistry` (`factory/registry/chart_pattern.py`)
- Add a relevant method in the `service/toolkits/chart_patterns.py` file
- Retrieve the instance anywhere in the codebase using:
  ```python
  ChartPatternFactory.get_chart_pattern(pattern=ChartPatternRegistry.HEAD_AND_SHOULDERS)

---

## 📘 Testing Your Code

- Immediately after implementing any file (factory, indicator, pattern, etc.), add this block at the end of the file:
  
  ```python
  # Example usage
  if __name__ == "__main__":
    ds = DataSourceFactory.get_data_source(data_source=DataSourceRegistry.YAHOO)
    print(ds.get_data(ticker="AAPL"))  # Fetch data for Apple Inc.

## 🧪 Research & Experimentation (/research_and_experimentation/)

  -	Use the research/ directory for any experimental or temporary scripts
  - Think of it like a rough notebook — it can include:
    - New endpoint exploration
    - Data API testing (e.g., from Polygon)
    - Experimental scripts or tools
  - You can create new files or folders under research/ as needed. These are not production code and are meant for isolated testing.