import io
from setuptools import setup, find_packages

with io.open('VERSION', 'r') as fd:
    VERSION = fd.read().rstrip()

requires = (
    'nextgisweb>=3.8.0.dev7',
)

entry_points = {
    'nextgisweb.packages': [
        'nextgisweb_formbuilder = nextgisweb_formbuilder:pkginfo',
    ],
    'nextgisweb.amd_packages': [
        'nextgisweb_formbuilder = nextgisweb_formbuilder:amd_packages',
    ],
}

setup(
    name='nextgisweb_formbuilder',
    version=VERSION,
    description="",
    long_description="",
    classifiers=[],
    keywords='',
    author='',
    author_email='',
    url='',
    license='',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    include_package_data=True,
    zip_safe=False,
    install_requires=requires,
    entry_points=entry_points,
)
