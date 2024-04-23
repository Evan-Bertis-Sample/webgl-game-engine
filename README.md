## webgl-game-engine

![Current Scene](./docs/images/final.png)

*A render of the final scene, featuring a cube robot with 8 legs on a platform that multiple dyson spheres orbit around, and a nice metalic ball in the center*

### Goals and Ambitions

As an engineer, I am driven by a deep desire to understand the tools I use. I aim to comprehend them not only at a usage level but also their underlying workings. For me, reaching this level of understanding is crucial for achieving proficiency and unlocking new technical possibilities. Prior to this project, I had already delved into the realm of computer graphics and scalable software design through my work on numerous games.

Eventually, I found myself immersed in the niche of game engine/graphics programming on YouTube, where the traditional "Hello, world!" transforms into rendering a triangle on the screen. These videos, coupled with my urge to understand my tools--primarily complete game engines--inspired me to begin developing my own game engine. The game engine I ultimately made was written using vanilla JS with WebGL, HTML, CSS, and python (for some development tools). There was no external library used, except for WebGL.

Although the project is comprehensive, it lacks key features like a visual editor and cast shadows. Nonetheless, this project has been one of my most technically challenging endeavors. It stretched my JavaScript and GLSL writing skills to their limits and enlightened me on the workings of many systems I previously took for granted, such as supporting multiple shaders and materials, lighting, and more.


### Scene Graph and Assemblies

![Scene Graph](./docs/images/scene_graph.jpg)

*Pardon the poor quality of the picture.*

The scene graph had to be slightly simplified for drawing purposes. In essence, there are 9 main children of the parent node:

* The Star Parent (invisible)
* The Robot (player)
* Physical Camera Object (allows the camera to have a transform)
* The Platform
* The Planet Parent (invisible)
* The Ball at the Orign
* The Crystal Parent (invisible)
* The Point Light Object controlled by the user
* The Dyson Sphere Parent (invisible)

There are a few jointed assmblies in the scene, which are as follows:

![Robot](./docs/images/robot.png) 

1. The robot, which is made up of 8 legs, a body, and a head. Each leg is made out of 5 segments, and the body and head are made of 3 segments total.

![Dyson Sphere](./docs/images/dyson_sphere.png)

2. The dyson spheres, which are made up of a black hole and a ring. These are joined together such that black hole is the parent of the ring. All dyson spheres are parented to an invisible object at the center of the scene, that constantly rotates.


![Crystal](./docs/images/crystal.png)

1. Each crystal is comprised of 4 segments. The base, and the 3 surrounding crystals that orbit around the base. The base is the parent of the 3 surrounding crystals. All crystals are parented to an invisible object at the center of the scene, that constantly rotates.

![Planet](./docs/images/planets.png)

5. The planet is combrised of 3 segments. The planet, it's moon, and the moon's moon. The planet is the parent of the moon, and the moon is the parent of the moon's moon. The planet is parented to an invisible object at the center of the scene, that constantly rotates.


### Help Guide

Running the project is simple. Just double click on the `Bertis-SampleEvan_ProjC.html` file, and it should open in your default web browser. The controls are as follows:


![Controls](./docs/images/control_modal.png)

* **WASD** - Move to move the player character
* **Space** - Switch the camera mode for the left viewport
    * For the Follow mode, the camera will follow the robot
    * For the Free mode, the camera will be free to move around the scene, and can be controlled using the mouse and WASD. You can rotate the camera with Mouse Drag. You can also raise and lower the camera with Q and E.

All controls can be viewed by clicking the `Controls` button in the bottom left of the screen.

Additionally, there is a button in the bottom left of the screen (`Toggle Lighting`) that will toggle between the Phong shading system and the debug mode, which shows the normals of the models. This is useful for debugging the scene, and seeing how the lighting system works.

New to this project is a bunch of lighting controls, seperated into two sections.

![Left Controls](./docs/images/controls_left.png)

Using these controls, you are able to modify some global lighting settings, particularly the lighting model used, and the attenuation function used. 

You can also choose to turn on/off the headlight, which is located at the camera's look at position.

In addition to this, you can change the materials of two objects in the scene: the sphere in the center of the scene, and the black whole inside of the player's head. I advise you try out the black hole material on the center sphere! You can see some cool vertex distortions.

![Right Controls](./docs/images/controls_right.png)

Using these controls, you are able to modify the position and colors of the point light in the scene. You can also change the color of the ambient light in the scene.

### Results

Here are some screenshots of the scene from different angles:

![Final Scene](./docs/images/final.png)
![Vertex Colors](./docs/images/vertex_colors.png)
![Platform](./docs/images/platform.png)
![Robot](./docs/images/robot.png)
![Dyson Sphere](./docs/images/dyson_sphere.png)
![Crystals](./docs/images/crystal.png)
![Planets](./docs/images/planets.png)


## Lighting Model Comparisions
![Phong](./docs/images/phong.png)
![Blinn-Phong](./docs/images/blinn_phong.png)
![Gouraud](./docs/images/gouraud.png)
![Blinn-Gouraud](./docs/images/blinn_gouraud.png)
![Stylized](./docs/images/stylized.png)


I am very happy with the results of this project. I was able to accomplish all of my goals, and I think the scene looks great. I was able to add a lot of color to the scene, and I was able to make the lighting system much more dynamic and flexible. I was also able to add more models to the scene, and make the scene more complex. I was also able to add more rendering options, and I think the scene looks great. I am very happy with the results of this project, and I think it is a great way to end the semester.
